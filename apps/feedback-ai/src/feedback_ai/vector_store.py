from collections.abc import Sequence
from typing import cast
from uuid import uuid4

import psycopg
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from pgvector import Vector
from pgvector.psycopg import register_vector_async
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

TABLE_NAME = "aide_vectors"
COLLECTION_TABLE_NAME = "aide_collections"


class PgVectorStore:
    """Shared LangChain document storage backed by the service's existing pgvector schema."""

    def __init__(self, postgres_url: str, embeddings: Embeddings) -> None:
        self.postgres_url = postgres_url
        self.embeddings = embeddings

    async def connect(self, *, register_vector: bool = True) -> psycopg.AsyncConnection[dict[str, object]]:
        connection = await psycopg.AsyncConnection.connect(self.postgres_url, row_factory=dict_row)
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

    async def add_documents(self, collection: str, documents: Sequence[Document]) -> None:
        if not documents:
            return
        embeddings = await self.embeddings.aembed_documents([document.page_content for document in documents])
        connection = await self.connect()
        async with connection:
            collection_id = await self.collection_id(connection, collection)
            async with connection.cursor() as cursor:
                await cursor.executemany(
                    f"INSERT INTO {TABLE_NAME} (id, text, metadata, embedding, collection_id) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    [
                        (
                            uuid4(),
                            document.page_content,
                            Jsonb(document.metadata),
                            Vector(embedding),
                            collection_id,
                        )
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
        query_embedding = await self.embeddings.aembed_query(query)
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
        return [
            Document(page_content=str(row["text"]), metadata=cast(dict[str, object], row["metadata"])) for row in rows
        ]

    async def delete_by_metadata(
        self,
        collection: str,
        metadata_filter: dict[str, object],
        except_filter: dict[str, object] | None = None,
    ) -> int:
        exclusion_sql = "AND NOT vectors.metadata @> %s" if except_filter else ""
        params: list[object] = [collection, Jsonb(metadata_filter)]
        if except_filter:
            params.append(Jsonb(except_filter))
        connection = await self.connect()
        async with connection:
            cursor = await connection.execute(
                f"""
                DELETE FROM {TABLE_NAME} vectors USING {COLLECTION_TABLE_NAME} collections
                WHERE collections.uuid = vectors.collection_id
                  AND collections.name = %s
                  AND vectors.metadata @> %s
                  {exclusion_sql}
                """,
                params,
            )
            return cursor.rowcount or 0
