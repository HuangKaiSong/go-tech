from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["assistant", "user"]
    content: str = Field(min_length=1, max_length=12_000)


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    history: list[ChatMessage] = Field(default_factory=list, max_length=16)
    question: str = Field(min_length=1, max_length=4_000)
    user_id: str = Field(min_length=1, max_length=200)


class ConversationSummary(BaseModel):
    """历史对话列表中的会话摘要。"""

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


class ConversationDetail(ConversationSummary):
    """用于恢复对话现场的会话详情。"""

    messages: list[ChatMessage]


class ConversationDeleteResult(BaseModel):
    """删除会话后的稳定响应。"""

    deleted: bool
    id: UUID


class ModuleInfo(BaseModel):
    id: str
    name: str
    capabilities: list[str]


class SyncRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)


class SyncResult(BaseModel):
    failed: int
    processed: int
    succeeded: int


class IngestResult(BaseModel):
    chunk_count: int
    document_count: int
