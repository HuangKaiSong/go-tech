from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["assistant", "user"]
    content: str = Field(min_length=1, max_length=12_000)


class ChatRequest(BaseModel):
    history: list[ChatMessage] = Field(default_factory=list, max_length=16)
    question: str = Field(min_length=1, max_length=4_000)
    user_id: str = Field(min_length=1, max_length=200)


class SyncRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)


class SyncResult(BaseModel):
    failed: int
    processed: int
    succeeded: int


class IngestResult(BaseModel):
    chunk_count: int
    document_count: int
