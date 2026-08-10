from functools import lru_cache

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "feedback-ai"
    app_version: str = "0.1.0"
    feedback_ai_internal_token: SecretStr = Field(default=SecretStr(""))

    mysql_database_url: str | None = None
    database_url: str | None = None
    postgres_url: str | None = None

    deepseek_api_key: SecretStr = Field(default=SecretStr(""))
    deepseek_model: str = "deepseek-v4-flash"
    deepseek_base_url: str = "https://api.deepseek.com"

    embedding_api_key: SecretStr = Field(default=SecretStr(""))
    embedding_base_url: str = "https://api.openai.com/v1"
    embedding_model: str = "text-embedding-3-small"

    rag_chunk_size: int = Field(default=800, gt=0)
    rag_chunk_overlap: int = Field(default=120, ge=0)
    rag_knowledge_limit: int = Field(default=4, gt=0, le=20)
    rag_memory_limit: int = Field(default=3, gt=0, le=20)

    @model_validator(mode="after")
    def validate_chunking(self) -> "Settings":
        if self.rag_chunk_overlap >= self.rag_chunk_size:
            raise ValueError("RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE")
        return self

    def require_mysql_url(self) -> str:
        value = self.mysql_database_url or self.database_url
        if not value:
            raise RuntimeError("MYSQL_DATABASE_URL is required (DATABASE_URL is also supported)")
        return value

    def require_postgres_url(self) -> str:
        if not self.postgres_url:
            raise RuntimeError("POSTGRES_URL is required")
        return self.postgres_url

    def require_chat_api_key(self) -> str:
        value = self.deepseek_api_key.get_secret_value()
        if not value:
            raise RuntimeError("DEEPSEEK_API_KEY is required")
        return value

    def require_embedding_api_key(self) -> str:
        value = self.embedding_api_key.get_secret_value()
        if not value:
            raise RuntimeError("EMBEDDING_API_KEY is required")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
