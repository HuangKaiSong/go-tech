import logging
from dataclasses import asdict
from uuid import uuid4

from feedback_ai.modules.feedback.config import FeedbackSettings
from feedback_ai.modules.feedback.mysql_source import MySQLSource
from feedback_ai.modules.feedback.repository import FeedbackRepository
from feedback_ai.modules.feedback.retrieval import split_documents

logger = logging.getLogger(__name__)


class FeedbackSyncService:
    """协调 MySQL 需求事实与 pgvector 检索索引的最终一致性。"""

    def __init__(
        self,
        settings: FeedbackSettings,
        source: MySQLSource,
        repository: FeedbackRepository,
    ) -> None:
        """注入模块配置、事实来源和知识仓储。"""

        self.settings = settings
        self.source = source
        self.repository = repository

    async def ingest(self) -> dict[str, int]:
        """全量读取需求、重新切片，并替换 MySQL 来源的知识。"""

        documents = await self.source.load_documents()
        chunks = split_documents(documents, self.settings, str(uuid4()))
        await self.repository.ensure_schema()
        await self.repository.delete_source()
        await self.repository.add_knowledge(chunks)
        return {"document_count": len(documents), "chunk_count": len(chunks)}

    async def sync_feature(self, feature_id: int) -> dict[str, int | str]:
        """按需求当前最终状态增量更新或删除对应知识切片。"""

        if feature_id <= 0:
            raise ValueError(f"Invalid feature_id: {feature_id}")
        documents = await self.source.load_documents(feature_id)
        await self.repository.ensure_schema()
        if not documents:
            count = await self.repository.delete_feature(feature_id)
            return {"action": "removed", "chunk_count": count, "feature_id": feature_id}

        sync_version = str(uuid4())
        chunks = split_documents(documents, self.settings, sync_version)
        # 先写新版本再删旧版本，避免 Embedding 或写入失败时知识完全消失。
        await self.repository.add_knowledge(chunks)
        await self.repository.delete_feature(feature_id, sync_version)
        return {"action": "updated", "chunk_count": len(chunks), "feature_id": feature_id}

    async def process_pending_jobs(self, limit: int) -> dict[str, int]:
        """逐条处理已领取任务，成功确认，失败则写入退避重试状态。"""

        jobs = await self.source.claim_sync_jobs(min(max(limit, 1), 50))
        succeeded = 0
        failed = 0
        for job in jobs:
            try:
                await self.sync_feature(job.feature_id)
                await self.source.complete_sync_job(job)
                succeeded += 1
            except Exception as error:
                logger.exception("Could not sync feature_id=%s; job=%s", job.feature_id, asdict(job))
                await self.source.fail_sync_job(job, error)
                failed += 1
        return {"failed": failed, "processed": len(jobs), "succeeded": succeeded}
