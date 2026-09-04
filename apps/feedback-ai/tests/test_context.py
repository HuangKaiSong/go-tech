from typing import cast

import pytest
from langchain_core.documents import Document

from feedback_ai.modules.feedback.config import FeedbackSettings
from feedback_ai.modules.feedback.repository import (
    FeedbackQuery,
    FeedbackQueryResult,
    FeedbackRepository,
    TrashResult,
)
from feedback_ai.modules.feedback.retrieval import build_context, should_remember, split_documents


class FakeFeedbackRepository:
    def __init__(self) -> None:
        self.metadata_query: FeedbackQuery | None = None

    async def similarity_search_knowledge(self, query: str, limit: int) -> list[Document]:
        del query, limit
        return [Document(page_content="需求 A", metadata={"feature_id": 1})]

    async def similarity_search_memory(self, query: str, user_id: str, limit: int) -> list[Document]:
        del query, user_id, limit
        return [Document(page_content="用户偏好简短回答", metadata={"source": "memory"})]

    async def find_by_numeric_field(self, field: str, minimum: int, inclusive: bool = False) -> list[Document]:
        return [Document(page_content=f"{field}={minimum}, inclusive={inclusive}", metadata={"feature_id": 2})]

    async def find_by_query(self, query: FeedbackQuery) -> FeedbackQueryResult:
        self.metadata_query = query
        return FeedbackQueryResult(
            documents=[
                Document(
                    page_content="HR 需求",
                    metadata={"created_at": "2026-03-01T09:00:00", "feature_id": 4, "system": "hr"},
                )
            ],
            total=3,
            pms_count=0,
            hr_count=3,
        )

    async def find_trash(self) -> TrashResult:
        return TrashResult(1, 2, [Document(page_content="已删除需求", metadata={"feature_id": 3})])


@pytest.mark.anyio
async def test_context_uses_exact_numeric_filters_and_memory() -> None:
    context = await build_context(
        "点赞至少 10 且评论数大于 2 的需求",
        "admin:1",
        cast(FeedbackRepository, FakeFeedbackRepository()),
        FeedbackSettings(),
    )

    assert "like_count >= 10" in context
    assert "comment_count > 2" in context
    assert "用户偏好简短回答" in context


@pytest.mark.anyio
async def test_context_uses_trash_query_instead_of_semantic_knowledge() -> None:
    context = await build_context(
        "回收站里有什么？",
        "admin:1",
        cast(FeedbackRepository, FakeFeedbackRepository()),
        FeedbackSettings(),
    )

    assert "被删除需求 2 条" in context
    assert "被删除评论 1 条" in context
    assert "知识库语义检索结果：无" in context


@pytest.mark.anyio
async def test_context_combines_system_created_at_and_numeric_filters() -> None:
    repository = FakeFeedbackRepository()

    context = await build_context(
        "2026 年 HR 系统点赞至少 10 的需求",
        "admin:1",
        cast(FeedbackRepository, repository),
        FeedbackSettings(),
    )

    assert repository.metadata_query is not None
    assert repository.metadata_query.systems == ("hr",)
    assert repository.metadata_query.created_from is not None
    assert repository.metadata_query.created_from.year == 2026
    assert repository.metadata_query.like_filter == (10, True)
    assert "共 3 条，PMS 0 条，HR 3 条" in context
    assert "system=hr" in context
    assert "created_at=2026-03-01T09:00:00" in context


def test_split_documents_adds_sync_metadata() -> None:
    chunks = split_documents(
        [Document(page_content="abcdefghij", metadata={"feature_id": 9})],
        FeedbackSettings(rag_chunk_size=6, rag_chunk_overlap=2),
        "sync-1",
    )

    assert [chunk.page_content for chunk in chunks] == ["abcdef", "efghij"]
    assert chunks[1].metadata == {
        "chunk_index": 1,
        "feature_id": 9,
        "source": "mysql_feature",
        "sync_version": "sync-1",
    }


def test_memory_intent_rejects_sensitive_content() -> None:
    assert should_remember("请记住我偏好简短回答") is True
    assert should_remember("请记住我的 API key") is False
