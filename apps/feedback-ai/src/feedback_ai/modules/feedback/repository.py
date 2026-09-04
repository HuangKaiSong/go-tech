from dataclasses import dataclass
from typing import Literal, cast

from langchain_core.documents import Document

from feedback_ai.vector_store import COLLECTION_TABLE_NAME, TABLE_NAME, PgVectorStore

KNOWLEDGE_COLLECTION = "aide_knowledge"
MEMORY_COLLECTION = "aide_long_term_memory"
SOURCE_NAME = "mysql_feature"


@dataclass(slots=True)
class TrashResult:
    deleted_comments: int
    deleted_features: int
    documents: list[Document]

    @property
    def total(self) -> int:
        return self.deleted_comments + self.deleted_features


class FeedbackRepository:
    def __init__(self, store: PgVectorStore) -> None:
        self.store = store

    async def ensure_schema(self) -> None:
        await self.store.ensure_schema()

    async def add_knowledge(self, documents: list[Document]) -> None:
        await self.store.add_documents(KNOWLEDGE_COLLECTION, documents)

    async def delete_source(self) -> int:
        return await self.store.delete_by_metadata(KNOWLEDGE_COLLECTION, {"source": SOURCE_NAME})

    async def delete_feature(self, feature_id: int, except_sync_version: str | None = None) -> int:
        except_filter: dict[str, object] | None = {"sync_version": except_sync_version} if except_sync_version else None
        return await self.store.delete_by_metadata(
            KNOWLEDGE_COLLECTION,
            {"feature_id": feature_id},
            except_filter,
        )

    async def similarity_search_knowledge(self, query: str, limit: int) -> list[Document]:
        return await self.store.similarity_search(
            KNOWLEDGE_COLLECTION,
            query,
            limit,
            {"is_deleted": False},
        )

    async def similarity_search_memory(self, query: str, user_id: str, limit: int) -> list[Document]:
        return await self.store.similarity_search(
            MEMORY_COLLECTION,
            query,
            limit,
            {"user_id": user_id},
        )

    async def remember(self, user_id: str, content: str) -> None:
        await self.store.add_documents(
            MEMORY_COLLECTION,
            [Document(page_content=content.strip(), metadata={"source": "long_term_memory", "user_id": user_id})],
        )

    async def find_by_numeric_field(
        self,
        field: Literal["like_count", "comment_count"],
        minimum: int,
        inclusive: bool = False,
        limit: int = 100,
    ) -> list[Document]:
        comparator = ">=" if inclusive else ">"
        safe_limit = min(max(limit, 1), 100)
        connection = await self.store.connect()
        async with connection:
            rows = await (
                await connection.execute(
                    f"""
                    WITH matched AS (
                        SELECT DISTINCT ON (vectors.metadata->>'feature_id') vectors.text, vectors.metadata
                        FROM {TABLE_NAME} vectors
                        INNER JOIN {COLLECTION_TABLE_NAME} collections ON collections.uuid = vectors.collection_id
                        WHERE collections.name = %s
                          AND COALESCE((vectors.metadata->>'is_deleted')::boolean, false) = false
                          AND vectors.metadata->>%s ~ '^[0-9]+$'
                          AND (vectors.metadata->>%s)::integer {comparator} %s
                        ORDER BY
                          vectors.metadata->>'feature_id',
                          COALESCE((vectors.metadata->>'chunk_index')::integer, 0)
                    )
                    SELECT text, metadata FROM matched
                    ORDER BY (metadata->>%s)::integer DESC
                    LIMIT %s
                    """,
                    (KNOWLEDGE_COLLECTION, field, field, minimum, field, safe_limit),
                )
            ).fetchall()
        return [
            Document(page_content=str(row["text"]), metadata=cast(dict[str, object], row["metadata"])) for row in rows
        ]

    async def find_trash(self, limit: int = 100) -> TrashResult:
        connection = await self.store.connect()
        async with connection:
            rows = await (
                await connection.execute(
                    f"""
                    WITH features AS (
                        SELECT DISTINCT ON (vectors.metadata->>'feature_id') vectors.text, vectors.metadata
                        FROM {TABLE_NAME} vectors
                        INNER JOIN {COLLECTION_TABLE_NAME} collections ON collections.uuid = vectors.collection_id
                        WHERE collections.name = %s
                        ORDER BY
                          vectors.metadata->>'feature_id',
                          COALESCE((vectors.metadata->>'chunk_index')::integer, 0)
                    ), trash AS (
                        SELECT text, metadata,
                          CASE WHEN COALESCE((metadata->>'is_deleted')::boolean, false)
                            THEN 1 ELSE 0 END AS deleted_feature,
                          CASE WHEN metadata->>'deleted_comment_count' ~ '^[0-9]+$'
                            THEN (metadata->>'deleted_comment_count')::integer ELSE 0 END AS deleted_comments
                        FROM features
                    )
                    SELECT text, metadata,
                      SUM(deleted_feature) OVER () AS deleted_features,
                      SUM(deleted_comments) OVER () AS deleted_comments
                    FROM trash
                    WHERE deleted_feature = 1 OR deleted_comments > 0
                    ORDER BY metadata->>'deleted_at' DESC NULLS LAST, metadata->>'feature_id'
                    LIMIT %s
                    """,
                    (KNOWLEDGE_COLLECTION, min(max(limit, 1), 100)),
                )
            ).fetchall()
        return TrashResult(
            deleted_comments=int(cast(int | str, rows[0]["deleted_comments"])) if rows else 0,
            deleted_features=int(cast(int | str, rows[0]["deleted_features"])) if rows else 0,
            documents=[
                Document(page_content=str(row["text"]), metadata=cast(dict[str, object], row["metadata"]))
                for row in rows
            ],
        )
