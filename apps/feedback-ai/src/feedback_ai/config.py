from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "feedback-ai"
    app_version: str = "0.1.0"
    feedback_ai_internal_token: SecretStr = Field(default=SecretStr(""))
    postgres_url: str | None = None

    def require_postgres_url(self) -> str:
        """返回平台级会话存储使用的 PostgreSQL 地址。"""

        if not self.postgres_url:
            raise RuntimeError("POSTGRES_URL is required")
        return self.postgres_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
