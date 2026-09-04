from datetime import datetime
from types import TracebackType
from typing import cast

import pytest

from feedback_ai.modules.feedback.repository import FeedbackQuery, FeedbackRepository
from feedback_ai.vector_store import PgVectorStore


class FakeCursor:
    async def fetchall(self) -> list[dict[str, object]]:
        return [
            {
                "hr_count": 1,
                "metadata": {
                    "created_at": "2026-01-02T09:00:00",
                    "feature_id": 7,
                    "system": "hr",
                },
                "pms_count": 0,
                "text": "HR 需求",
                "total_count": 1,
            }
        ]


class FakeConnection:
    def __init__(self) -> None:
        self.query = ""
        self.params: list[object] = []

    async def __aenter__(self) -> "FakeConnection":
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        del exc_type, exc, traceback

    async def execute(self, query: str, params: list[object]) -> FakeCursor:
        self.query = query
        self.params = params
        return FakeCursor()


class FakeStore:
    def __init__(self) -> None:
        self.connection = FakeConnection()

    async def connect(self) -> FakeConnection:
        return self.connection


@pytest.mark.anyio
async def test_combined_metadata_query_uses_exact_filters_and_returns_counts() -> None:
    store = FakeStore()
    repository = FeedbackRepository(cast(PgVectorStore, store))

    result = await repository.find_by_query(
        FeedbackQuery(
            systems=("hr",),
            created_from=datetime(2026, 1, 1),
            created_to=datetime(2027, 1, 1),
            like_filter=(10, True),
            comment_filter=(2, False),
        )
    )

    assert "LOWER(vectors.metadata->>'system') IN (%s)" in store.connection.query
    assert "(vectors.metadata->>'like_count')::integer >= %s" in store.connection.query
    assert "(vectors.metadata->>'comment_count')::integer > %s" in store.connection.query
    assert store.connection.params == [
        "aide_knowledge",
        "hr",
        datetime(2026, 1, 1),
        datetime(2027, 1, 1),
        10,
        2,
        100,
    ]
    assert result.total == 1
    assert result.hr_count == 1
    assert result.documents[0].metadata["feature_id"] == 7
