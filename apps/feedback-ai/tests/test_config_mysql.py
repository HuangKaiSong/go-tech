from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from feedback_ai.config import Settings
from feedback_ai.mysql_source import MySQLSource, mysql_connection_options


def test_settings_supports_legacy_mysql_url_and_requires_secrets() -> None:
    settings = Settings(database_url="mysql://legacy/db", _env_file=None)

    assert settings.require_mysql_url() == "mysql://legacy/db"
    with pytest.raises(RuntimeError, match="POSTGRES_URL"):
        settings.require_postgres_url()
    with pytest.raises(RuntimeError, match="DEEPSEEK_API_KEY"):
        settings.require_chat_api_key()
    with pytest.raises(RuntimeError, match="EMBEDDING_API_KEY"):
        settings.require_embedding_api_key()


def test_settings_rejects_invalid_chunk_overlap() -> None:
    with pytest.raises(ValidationError, match="RAG_CHUNK_OVERLAP"):
        Settings(rag_chunk_size=10, rag_chunk_overlap=10)


def test_mysql_connection_options_parses_and_decodes_url() -> None:
    options = mysql_connection_options("mysql://user%40example:p%40ss@db.internal:3307/feedback")

    assert options["host"] == "db.internal"
    assert options["port"] == 3307
    assert options["user"] == "user@example"
    assert options["password"] == "p@ss"
    assert options["db"] == "feedback"
    assert "cursorclass" not in options


@pytest.mark.parametrize("url", ["postgresql://localhost/db", "mysql://localhost"])
def test_mysql_connection_options_rejects_invalid_url(url: str) -> None:
    with pytest.raises(ValueError, match="MYSQL_DATABASE_URL"):
        mysql_connection_options(url)


def test_mysql_row_is_rendered_as_feedback_document() -> None:
    source = MySQLSource(Settings(mysql_database_url="mysql://user:password@localhost/feedback"))
    deleted_at = datetime(2026, 1, 2, tzinfo=UTC)
    document = source._to_document(
        {
            "category_name": "产品",
            "comment_count": 4,
            "deleted_at": deleted_at,
            "deleted_comment_count": 1,
            "deleted_comments": "旧评论",
            "description": "描述",
            "id": 7,
            "like_count": 12,
            "official_replies": "官方回复",
            "shipped_at": None,
            "status": "pending",
            "sub_category_name": "移动端",
            "title": "深色模式",
            "version": "2.0",
        }
    )

    assert "標題：深色模式" in document.text
    assert "資料狀態：已移至回收站" in document.text
    assert document.metadata["feature_id"] == 7
    assert document.metadata["is_deleted"] is True
