import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import cast
from uuid import UUID, uuid4

import psycopg
from psycopg.rows import dict_row

from feedback_ai.schemas import ChatMessage

CONVERSATION_TABLE_NAME = "aide_conversations"
MESSAGE_TABLE_NAME = "aide_conversation_messages"


class ConversationNotFoundError(LookupError):
    """会话不存在，或不属于当前模块和用户。"""


@dataclass(frozen=True, slots=True)
class Conversation:
    """对外展示的会话摘要。"""

    id: UUID
    module_id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


@dataclass(frozen=True, slots=True)
class ConversationDetail:
    """会话摘要及按发送顺序排列的全部消息。"""

    conversation: Conversation
    messages: list[ChatMessage]


class ConversationRepository:
    """在 PostgreSQL 中持久化所有助手模块的短期对话。"""

    def __init__(self, postgres_url: str) -> None:
        self.postgres_url = postgres_url
        self._schema_ready = False
        self._schema_lock = asyncio.Lock()

    async def connect(self) -> psycopg.AsyncConnection[dict[str, object]]:
        """创建使用字典行的异步数据库连接。"""

        return await psycopg.AsyncConnection.connect(self.postgres_url, row_factory=dict_row)

    async def ensure_schema(self) -> None:
        """每个进程只检查一次会话表，避免聊天请求重复执行 DDL。"""

        if self._schema_ready:
            return
        async with self._schema_lock:
            if self._schema_ready:
                return
            connection = await self.connect()
            async with connection:
                await connection.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {CONVERSATION_TABLE_NAME} (
                        id uuid PRIMARY KEY,
                        module_id varchar(100) NOT NULL,
                        user_id varchar(200) NOT NULL,
                        title varchar(160) NOT NULL,
                        created_at timestamptz NOT NULL DEFAULT now(),
                        updated_at timestamptz NOT NULL DEFAULT now()
                    )
                    """
                )
                await connection.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {MESSAGE_TABLE_NAME} (
                        id bigserial PRIMARY KEY,
                        conversation_id uuid NOT NULL REFERENCES {CONVERSATION_TABLE_NAME}(id) ON DELETE CASCADE,
                        role varchar(20) NOT NULL CHECK (role IN ('user', 'assistant')),
                        content text NOT NULL,
                        created_at timestamptz NOT NULL DEFAULT now()
                    )
                    """
                )
                await connection.execute(
                    f"CREATE INDEX IF NOT EXISTS idx_{CONVERSATION_TABLE_NAME}_owner "
                    f"ON {CONVERSATION_TABLE_NAME}(module_id, user_id, updated_at DESC)"
                )
                await connection.execute(
                    f"CREATE INDEX IF NOT EXISTS idx_{MESSAGE_TABLE_NAME}_conversation "
                    f"ON {MESSAGE_TABLE_NAME}(conversation_id, id)"
                )
            self._schema_ready = True

    @staticmethod
    def title_from_question(question: str) -> str:
        """把首个问题压缩为适合历史列表展示的单行标题。"""

        title = " ".join(question.split())
        return title[:80] or "新对话"

    @staticmethod
    def _conversation_from_row(row: dict[str, object]) -> Conversation:
        """将数据库行转换为稳定的领域对象。"""

        return Conversation(
            id=cast(UUID, row["id"]),
            module_id=str(row["module_id"]),
            user_id=str(row["user_id"]),
            title=str(row["title"]),
            created_at=cast(datetime, row["created_at"]),
            updated_at=cast(datetime, row["updated_at"]),
            message_count=int(cast(int | str, row["message_count"])),
        )

    async def create(self, module_id: str, user_id: str, question: str) -> Conversation:
        """在首次提问时创建会话，并以问题生成默认标题。"""

        await self.ensure_schema()
        conversation_id = uuid4()
        connection = await self.connect()
        async with connection:
            row = await (
                await connection.execute(
                    f"""
                    INSERT INTO {CONVERSATION_TABLE_NAME} (id, module_id, user_id, title)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, module_id, user_id, title, created_at, updated_at, 0 AS message_count
                    """,
                    (conversation_id, module_id, user_id, self.title_from_question(question)),
                )
            ).fetchone()
        if row is None:
            raise RuntimeError("Could not create assistant conversation")
        return self._conversation_from_row(row)

    async def get(self, module_id: str, user_id: str, conversation_id: UUID) -> Conversation:
        """读取会话并同时校验模块和用户归属。"""

        await self.ensure_schema()
        connection = await self.connect()
        async with connection:
            row = await (
                await connection.execute(
                    f"""
                    SELECT conversations.id, conversations.module_id, conversations.user_id, conversations.title,
                      conversations.created_at, conversations.updated_at, COUNT(messages.id) AS message_count
                    FROM {CONVERSATION_TABLE_NAME} conversations
                    LEFT JOIN {MESSAGE_TABLE_NAME} messages ON messages.conversation_id = conversations.id
                    WHERE conversations.id = %s AND conversations.module_id = %s AND conversations.user_id = %s
                    GROUP BY conversations.id
                    """,
                    (conversation_id, module_id, user_id),
                )
            ).fetchone()
        if row is None:
            raise ConversationNotFoundError(str(conversation_id))
        return self._conversation_from_row(row)

    async def list_conversations(self, module_id: str, user_id: str, limit: int = 50) -> list[Conversation]:
        """按最近活动时间返回当前用户的会话摘要。"""

        await self.ensure_schema()
        connection = await self.connect()
        async with connection:
            rows = await (
                await connection.execute(
                    f"""
                    SELECT conversations.id, conversations.module_id, conversations.user_id, conversations.title,
                      conversations.created_at, conversations.updated_at, COUNT(messages.id) AS message_count
                    FROM {CONVERSATION_TABLE_NAME} conversations
                    LEFT JOIN {MESSAGE_TABLE_NAME} messages ON messages.conversation_id = conversations.id
                    WHERE conversations.module_id = %s AND conversations.user_id = %s
                    GROUP BY conversations.id
                    ORDER BY conversations.updated_at DESC, conversations.id DESC
                    LIMIT %s
                    """,
                    (module_id, user_id, min(max(limit, 1), 100)),
                )
            ).fetchall()
        return [self._conversation_from_row(row) for row in rows]

    async def messages(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
        limit: int | None = None,
        *,
        owner_validated: bool = False,
    ) -> list[ChatMessage]:
        """读取会话消息；有限条数时保留最新消息并恢复正序。"""

        if not owner_validated:
            await self.get(module_id, user_id, conversation_id)
        safe_limit = min(max(limit, 1), 200) if limit is not None else None
        limit_sql = "LIMIT %s" if safe_limit is not None else ""
        params: list[object] = [conversation_id]
        if safe_limit is not None:
            params.append(safe_limit)
        connection = await self.connect()
        async with connection:
            rows = await (
                await connection.execute(
                    f"""
                    SELECT role, content
                    FROM (
                        SELECT id, role, content
                        FROM {MESSAGE_TABLE_NAME}
                        WHERE conversation_id = %s
                        ORDER BY id DESC
                        {limit_sql}
                    ) recent
                    ORDER BY id ASC
                    """,
                    params,
                )
            ).fetchall()
        return [ChatMessage(role=cast(str, row["role"]), content=str(row["content"])) for row in rows]

    async def detail(self, module_id: str, user_id: str, conversation_id: UUID) -> ConversationDetail:
        """返回会话摘要和完整消息，供管理后台恢复历史现场。"""

        conversation = await self.get(module_id, user_id, conversation_id)
        messages = await self.messages(module_id, user_id, conversation_id, owner_validated=True)
        return ConversationDetail(conversation=conversation, messages=messages)

    async def load_for_chat(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
        limit: int,
    ) -> ConversationDetail:
        """用一次查询校验会话归属并读取最近消息，缩短追问的准备时间。"""

        await self.ensure_schema()
        connection = await self.connect()
        async with connection:
            rows = await (
                await connection.execute(
                    f"""
                    SELECT conversations.id, conversations.module_id, conversations.user_id, conversations.title,
                      conversations.created_at, conversations.updated_at,
                      (SELECT COUNT(*) FROM {MESSAGE_TABLE_NAME} all_messages
                       WHERE all_messages.conversation_id = conversations.id) AS message_count,
                      recent.id AS message_id, recent.role, recent.content
                    FROM {CONVERSATION_TABLE_NAME} conversations
                    LEFT JOIN LATERAL (
                        SELECT messages.id, messages.role, messages.content
                        FROM {MESSAGE_TABLE_NAME} messages
                        WHERE messages.conversation_id = conversations.id
                        ORDER BY messages.id DESC
                        LIMIT %s
                    ) recent ON true
                    WHERE conversations.id = %s
                      AND conversations.module_id = %s
                      AND conversations.user_id = %s
                    ORDER BY recent.id ASC
                    """,
                    (min(max(limit, 1), 32), conversation_id, module_id, user_id),
                )
            ).fetchall()
        if not rows:
            raise ConversationNotFoundError(str(conversation_id))
        messages = [
            ChatMessage(role=cast(str, row["role"]), content=str(row["content"]))
            for row in rows
            if row["message_id"] is not None
        ]
        return ConversationDetail(conversation=self._conversation_from_row(rows[0]), messages=messages)

    async def append_exchange(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
        question: str,
        answer: str,
    ) -> None:
        """原子保存一轮完整问答，失败或中断的回答不会形成半条历史。"""

        await self.get(module_id, user_id, conversation_id)
        connection = await self.connect()
        async with connection:
            async with connection.cursor() as cursor:
                await cursor.executemany(
                    f"INSERT INTO {MESSAGE_TABLE_NAME} (conversation_id, role, content) VALUES (%s, %s, %s)",
                    [
                        (conversation_id, "user", question),
                        (conversation_id, "assistant", answer),
                    ],
                )
            await connection.execute(
                f"UPDATE {CONVERSATION_TABLE_NAME} SET updated_at = now() "
                "WHERE id = %s AND module_id = %s AND user_id = %s",
                (conversation_id, module_id, user_id),
            )

    async def delete(self, module_id: str, user_id: str, conversation_id: UUID) -> None:
        """删除当前用户的会话；消息通过外键级联删除。"""

        await self.ensure_schema()
        connection = await self.connect()
        async with connection:
            cursor = await connection.execute(
                f"DELETE FROM {CONVERSATION_TABLE_NAME} WHERE id = %s AND module_id = %s AND user_id = %s",
                (conversation_id, module_id, user_id),
            )
        if not cursor.rowcount:
            raise ConversationNotFoundError(str(conversation_id))
