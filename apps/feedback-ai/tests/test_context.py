from typing import cast

import pytest

from feedback_ai.config import Settings
from feedback_ai.documents import Document
from feedback_ai.retrieval import build_context, should_remember, split_documents
from feedback_ai.vector_store import TrashResult, VectorStore


class FakeVectorStore:
    async def similarity_search(
        self,
        collection: str,
        query: str,
        limit: int,
        metadata_filter: dict[str, object] | None = None,
    ) -> list[Document]:
        del query, limit, metadata_filter
        if collection == "aide_long_term_memory":
            return [Document("用户偏好简短回答", {"source": "memory"})]
        return [Document("需求 A", {"feature_id": 1})]

    async def find_by_numeric_field(self, field: str, minimum: int, inclusive: bool = False) -> list[Document]:
        return [Document(f"{field}={minimum}, inclusive={inclusive}", {"feature_id": 2})]

    async def find_trash(self) -> TrashResult:
        return TrashResult(1, 2, [Document("已删除需求", {"feature_id": 3})])


@pytest.mark.anyio
async def test_context_uses_exact_numeric_filters_and_memory() -> None:
    context = await build_context(
        "点赞至少 10 且评论数大于 2 的需求",
        "admin:1",
        cast(VectorStore, FakeVectorStore()),
        Settings(),
    )

    assert "like_count >= 10" in context
    assert "comment_count > 2" in context
    assert "用户偏好简短回答" in context


@pytest.mark.anyio
async def test_context_uses_trash_query_instead_of_semantic_knowledge() -> None:
    context = await build_context(
        "回收站里有什么？",
        "admin:1",
        cast(VectorStore, FakeVectorStore()),
        Settings(),
    )

    assert "被删除需求 2 条" in context
    assert "被删除评论 1 条" in context
    assert "知识库语义检索结果：无" in context


def test_split_documents_adds_sync_metadata() -> None:
    chunks = split_documents(
        [Document("abcdefghij", {"feature_id": 9})],
        Settings(rag_chunk_size=6, rag_chunk_overlap=2),
        "sync-1",
    )

    assert [chunk.text for chunk in chunks] == ["abcdef", "efghij"]
    assert chunks[1].metadata == {
        "chunk_index": 1,
        "feature_id": 9,
        "source": "mysql_feature",
        "sync_version": "sync-1",
    }


def test_memory_intent_rejects_sensitive_content() -> None:
    assert should_remember("请记住我偏好简短回答") is True
    assert should_remember("请记住我的 API key") is False
