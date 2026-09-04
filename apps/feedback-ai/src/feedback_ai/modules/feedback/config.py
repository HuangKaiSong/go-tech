from functools import lru_cache

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class FeedbackSettings(BaseSettings):
    """需求反馈模块的独立配置，继续兼容现有环境变量名称。"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

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
    def validate_chunking(self) -> "FeedbackSettings":
        """确保切片重叠量小于切片长度，避免分片器无法前进。"""

        if self.rag_chunk_overlap >= self.rag_chunk_size:
            raise ValueError("RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE")
        return self

    def require_mysql_url(self) -> str:
        """返回 MySQL 地址，并兼容历史 DATABASE_URL 配置。"""

        value = self.mysql_database_url or self.database_url
        if not value:
            raise RuntimeError("MYSQL_DATABASE_URL is required (DATABASE_URL is also supported)")
        return value

    def require_postgres_url(self) -> str:
        """返回 pgvector 所在 PostgreSQL 地址。"""

        if not self.postgres_url:
            raise RuntimeError("POSTGRES_URL is required")
        return self.postgres_url

    def require_chat_api_key(self) -> str:
        """返回聊天模型密钥，缺失时在真正使用模型前失败。"""

        value = self.deepseek_api_key.get_secret_value()
        if not value:
            raise RuntimeError("DEEPSEEK_API_KEY is required")
        return value

    def require_embedding_api_key(self) -> str:
        """返回 Embedding 密钥，缺失时在构建知识仓储前失败。"""

        value = self.embedding_api_key.get_secret_value()
        if not value:
            raise RuntimeError("EMBEDDING_API_KEY is required")
        return value


@lru_cache
def get_feedback_settings() -> FeedbackSettings:
    """缓存需求反馈配置，避免每个请求重复解析环境文件。"""

    return FeedbackSettings()
