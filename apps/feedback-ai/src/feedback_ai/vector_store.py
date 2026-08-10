from dataclasses import dataclass
from typing import Literal, cast
from uuid import uuid4

import psycopg
from openai import AsyncOpenAI
from pgvector import Vector
from pgvector.psycopg import register_vector_async
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from feedback_ai.config import Settings
from feedback_ai.documents import Document

TABLE_NAME = "aide_vectors"
COLLECTION_TABLE_NAME = "aide_collections"


@dataclass(slots=True)
class TrashResult:
    deleted_comments: int
    deleted_features: int
    documents: list[Document]

    @property
    def total(self) -> int:
        return self.deleted_comments + self.deleted_features


class VectorStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.embedding_client = AsyncOpenAI(
            api_key=settings.require_embedding_api_key(),
            base_url=settings.embedding_base_url,
        )

    async def connect(self, *, register_vector: bool = True) -> psycopg.AsyncConnection[dict[str, object]]:
        connection = await psycopg.AsyncConnection.connect(
            self.settings.require_postgres_url(),
            row_factory=dict_row,
        )
        if register_vector:
            await register_vector_async(connection)
        return connection

    async def ensure_schema(self) -> None:
        connection = await self.connect(register_vector=False)
        async with connection:
            await connection.execute("CREATE EXTENSION IF NOT EXISTS vector")
            await register_vector_async(connection)
            await connection.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                    text text NOT NULL,
                    metadata jsonb NOT NULL DEFAULT '{{}}'::jsonb,
                    embedding vector,
                    collection_id uuid
                )
                """
            )
            await connection.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {COLLECTION_TABLE_NAME} (
                    uuid uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                    name varchar,
                    cmetadata jsonb
                )
                """
            )
            await connection.execute(
                f"CREATE INDEX IF NOT EXISTS idx_{COLLECTION_TABLE_NAME}_name ON {COLLECTION_TABLE_NAME}(name)"
            )
            await connection.execute(f"ALTER TABLE {TABLE_NAME} ADD COLUMN IF NOT EXISTS collection_id uuid")

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = await self.embedding_client.embeddings.create(model=self.settings.embedding_model, input=texts)
        return [item.embedding for item in response.data]

    async def collection_id(self, connection: psycopg.AsyncConnection[dict[str, object]], name: str) -> object:
        row = await (
            await connection.execute(f"SELECT uuid FROM {COLLECTION_TABLE_NAME} WHERE name = %s LIMIT 1", (name,))
        ).fetchone()
        if row:
            return row["uuid"]
        row = await (
            await connection.execute(f"INSERT INTO {COLLECTION_TABLE_NAME} (name) VALUES (%s) RETURNING uuid", (name,))
        ).fetchone()
        if row is None:
            raise RuntimeError(f"Could not create vector collection {name}")
        return row["uuid"]

    async def add_documents(self, collection: str, documents: list[Document]) -> None:
        if not documents:
            return
        embeddings = await self.embed([document.text for document in documents])
        connection = await self.connect()
        async with connection:
            collection_id = await self.collection_id(connection, collection)
            async with connection.cursor() as cursor:
                await cursor.executemany(
                    f"INSERT INTO {TABLE_NAME} (id, text, metadata, embedding, collection_id) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    [
                        (uuid4(), document.text, Jsonb(document.metadata), Vector(embedding), collection_id)
                        for document, embedding in zip(documents, embeddings, strict=True)
                    ],
                )

    async def similarity_search(
        self,
        collection: str,
        query: str,
        limit: int,
        metadata_filter: dict[str, object] | None = None,
    ) -> list[Document]:
        query_embedding = (await self.embed([query]))[0]
        filter_sql = "AND vectors.metadata @> %s" if metadata_filter else ""
        params: list[object] = [collection]
        if metadata_filter:
            params.append(Jsonb(metadata_filter))
        params.extend([Vector(query_embedding), limit])

        connection = await self.connect()
        async with connection:
            rows = await (
                await connection.execute(
                    f"""
                    SELECT vectors.text, vectors.metadata
                    FROM {TABLE_NAME} vectors
                    INNER JOIN {COLLECTION_TABLE_NAME} collections ON collections.uuid = vectors.collection_id
                    WHERE collections.name = %s {filter_sql}
                    ORDER BY vectors.embedding <=> %s
                    LIMIT %s
                    """,
                    params,
                )
            ).fetchall()
        return [Document(text=str(row["text"]), metadata=cast(dict[str, object], row["metadata"])) for row in rows]

    async def find_by_numeric_field(
        self,
        field: Literal["like_count", "comment_count"],
        minimum: int,
        inclusive: bool = False,
        limit: int = 100,
    ) -> list[Document]:
        comparator = ">=" if inclusive else ">"
        safe_limit = min(max(limit, 1), 100)
        connection = await self.connect()
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
                    ("aide_knowledge", field, field, minimum, field, safe_limit),
                )
            ).fetchall()
        return [Document(text=str(row["text"]), metadata=cast(dict[str, object], row["metadata"])) for row in rows]

    async def find_trash(self, limit: int = 100) -> TrashResult:
        connection = await self.connect()
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
                    ("aide_knowledge", min(max(limit, 1), 100)),
                )
            ).fetchall()
        return TrashResult(
            deleted_comments=int(cast(int | str, rows[0]["deleted_comments"])) if rows else 0,
            deleted_features=int(cast(int | str, rows[0]["deleted_features"])) if rows else 0,
            documents=[
                Document(text=str(row["text"]), metadata=cast(dict[str, object], row["metadata"])) for row in rows
            ],
        )

    async def delete_by_source(self, source: str) -> int:
        return await self._delete_where("vectors.metadata->>'source' = %s", (source,))

    async def delete_feature(self, feature_id: int, except_sync_version: str | None = None) -> int:
        return await self._delete_where(
            "vectors.metadata->>'feature_id' = %s "
            "AND (%s::text IS NULL OR vectors.metadata->>'sync_version' IS DISTINCT FROM %s)",
            (str(feature_id), except_sync_version, except_sync_version),
        )

    async def _delete_where(self, condition: str, params: tuple[object, ...]) -> int:
        connection = await self.connect()
        async with connection:
            cursor = await connection.execute(
                f"""
                DELETE FROM {TABLE_NAME} vectors USING {COLLECTION_TABLE_NAME} collections
                WHERE collections.uuid = vectors.collection_id
                  AND collections.name = %s
                  AND {condition}
                """,
                ("aide_knowledge", *params),
            )
            return cursor.rowcount or 0

    async def remember(self, user_id: str, content: str) -> str:
        memory_id = str(uuid4())
        await self.add_documents(
            "aide_long_term_memory",
            [Document(text=content.strip(), metadata={"source": "long_term_memory", "user_id": user_id})],
        )
        return memory_id
