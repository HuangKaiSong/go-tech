from typing import cast

import pytest

from feedback_ai.config import Settings
from feedback_ai.documents import Document
from feedback_ai.mysql_source import MySQLSource, SyncJob
from feedback_ai.sync import FeedbackSyncService
from feedback_ai.vector_store import VectorStore


class FakeSource:
    def __init__(self, documents: list[Document]) -> None:
        self.documents = documents
        self.completed: list[int] = []
        self.failed: list[int] = []

    async def load_documents(self, feature_id: int | None = None) -> list[Document]:
        del feature_id
        return self.documents

    async def claim_sync_jobs(self, limit: int) -> list[SyncJob]:
        assert limit == 2
        return [SyncJob(attempts=0, feature_id=1, revision=1), SyncJob(attempts=0, feature_id=2, revision=1)]

    async def complete_sync_job(self, job: SyncJob) -> None:
        self.completed.append(job.feature_id)

    async def fail_sync_job(self, job: SyncJob, error: Exception) -> None:
        assert str(error) == "embedding failed"
        self.failed.append(job.feature_id)


class FakeStore:
    def __init__(self) -> None:
        self.calls: list[str] = []

    async def ensure_schema(self) -> None:
        self.calls.append("ensure")

    async def delete_by_source(self, source: str) -> int:
        self.calls.append(f"delete-source:{source}")
        return 1

    async def add_documents(self, collection: str, documents: list[Document]) -> None:
        self.calls.append(f"add:{collection}:{len(documents)}")

    async def delete_feature(self, feature_id: int, except_sync_version: str | None = None) -> int:
        self.calls.append(f"delete-feature:{feature_id}:{except_sync_version is not None}")
        return 3


def create_service(source: FakeSource, store: FakeStore) -> FeedbackSyncService:
    return FeedbackSyncService(
        Settings(rag_chunk_size=20, rag_chunk_overlap=2),
        cast(MySQLSource, source),
        cast(VectorStore, store),
    )


@pytest.mark.anyio
async def test_ingest_replaces_mysql_knowledge() -> None:
    source = FakeSource([Document("feedback", {"feature_id": 1})])
    store = FakeStore()

    result = await create_service(source, store).ingest()

    assert result == {"chunk_count": 1, "document_count": 1}
    assert store.calls == ["ensure", "delete-source:mysql_feature", "add:aide_knowledge:1"]


@pytest.mark.anyio
async def test_sync_feature_inserts_new_chunks_before_deleting_old_chunks() -> None:
    source = FakeSource([Document("feedback", {"feature_id": 1})])
    store = FakeStore()

    result = await create_service(source, store).sync_feature(1)

    assert result["action"] == "updated"
    assert store.calls[1].startswith("add:aide_knowledge")
    assert store.calls[2] == "delete-feature:1:True"


@pytest.mark.anyio
async def test_sync_feature_removes_missing_feedback() -> None:
    source = FakeSource([])
    store = FakeStore()

    result = await create_service(source, store).sync_feature(1)

    assert result == {"action": "removed", "chunk_count": 3, "feature_id": 1}


@pytest.mark.anyio
async def test_pending_jobs_are_completed_or_retried(monkeypatch: pytest.MonkeyPatch) -> None:
    source = FakeSource([Document("feedback", {"feature_id": 1})])
    service = create_service(source, FakeStore())

    async def sync_feature(feature_id: int) -> dict[str, int]:
        if feature_id == 2:
            raise RuntimeError("embedding failed")
        return {"feature_id": feature_id}

    monkeypatch.setattr(service, "sync_feature", sync_feature)
    result = await service.process_pending_jobs(2)

    assert result == {"failed": 1, "processed": 2, "succeeded": 1}
    assert source.completed == [1]
    assert source.failed == [2]
