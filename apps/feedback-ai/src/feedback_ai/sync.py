import logging
from dataclasses import asdict
from uuid import uuid4

from feedback_ai.config import Settings
from feedback_ai.mysql_source import MySQLSource
from feedback_ai.retrieval import split_documents
from feedback_ai.vector_store import VectorStore

logger = logging.getLogger(__name__)


class FeedbackSyncService:
    def __init__(self, settings: Settings, source: MySQLSource, store: VectorStore) -> None:
        self.settings = settings
        self.source = source
        self.store = store

    async def ingest(self) -> dict[str, int]:
        documents = await self.source.load_documents()
        chunks = split_documents(documents, self.settings, str(uuid4()))
        await self.store.ensure_schema()
        await self.store.delete_by_source("mysql_feature")
        await self.store.add_documents("aide_knowledge", chunks)
        return {"document_count": len(documents), "chunk_count": len(chunks)}

    async def sync_feature(self, feature_id: int) -> dict[str, int | str]:
        if feature_id <= 0:
            raise ValueError(f"Invalid feature_id: {feature_id}")
        documents = await self.source.load_documents(feature_id)
        await self.store.ensure_schema()
        if not documents:
            count = await self.store.delete_feature(feature_id)
            return {"action": "removed", "chunk_count": count, "feature_id": feature_id}

        sync_version = str(uuid4())
        chunks = split_documents(documents, self.settings, sync_version)
        await self.store.add_documents("aide_knowledge", chunks)
        await self.store.delete_feature(feature_id, sync_version)
        return {"action": "updated", "chunk_count": len(chunks), "feature_id": feature_id}

    async def process_pending_jobs(self, limit: int) -> dict[str, int]:
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
