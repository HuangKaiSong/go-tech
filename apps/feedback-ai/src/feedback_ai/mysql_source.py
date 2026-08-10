from dataclasses import dataclass
from datetime import datetime
from typing import cast
from urllib.parse import unquote, urlsplit

import asyncmy
from asyncmy.cursors import DictCursor

from feedback_ai.config import Settings
from feedback_ai.documents import Document


def mysql_connection_options(database_url: str) -> dict[str, object]:
    parsed = urlsplit(database_url)
    if parsed.scheme not in {"mysql", "mysql+asyncmy"}:
        raise ValueError("MYSQL_DATABASE_URL must use the mysql scheme")
    if not parsed.hostname or not parsed.path.lstrip("/"):
        raise ValueError("MYSQL_DATABASE_URL must include a host and database")
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "db": unquote(parsed.path.lstrip("/")),
        "charset": "utf8mb4",
    }


@dataclass(slots=True)
class SyncJob:
    attempts: int
    feature_id: int
    revision: int


class MySQLSource:
    def __init__(self, settings: Settings) -> None:
        self.connection_options = mysql_connection_options(settings.require_mysql_url())

    async def connect(self) -> asyncmy.Connection:
        return await asyncmy.connect(**self.connection_options)

    async def load_documents(self, feature_id: int | None = None) -> list[Document]:
        feature_condition = "" if feature_id is None else "AND f.id = %s"
        connection = await self.connect()
        try:
            async with connection.cursor(DictCursor) as cursor:
                await cursor.execute(
                    f"""
                    SELECT
                      f.id, f.title, f.description, f.status, f.like_count, f.deleted_at, f.shipped_at, f.version,
                      c.name AS category_name, sc.name AS sub_category_name,
                      (
                        SELECT COUNT(*) FROM fb_comment visible_comment
                        WHERE visible_comment.feature_id = f.id
                          AND visible_comment.deleted_at IS NULL
                          AND visible_comment.is_visible = 1
                          AND visible_comment.hidden_at IS NULL
                      ) AS comment_count,
                      (
                        SELECT COUNT(*) FROM fb_comment deleted_comment
                        WHERE deleted_comment.feature_id = f.id AND deleted_comment.deleted_at IS NOT NULL
                      ) AS deleted_comment_count,
                      (
                        SELECT GROUP_CONCAT(
                          CONCAT('[comment_id=', deleted_comment.id, '] ', deleted_comment.content)
                          ORDER BY deleted_comment.deleted_at DESC SEPARATOR ' | '
                        )
                        FROM fb_comment deleted_comment
                        WHERE deleted_comment.feature_id = f.id AND deleted_comment.deleted_at IS NOT NULL
                      ) AS deleted_comments,
                      GROUP_CONCAT(com.content SEPARATOR ' | ') AS official_replies
                    FROM fb_feature f
                    LEFT JOIN fb_category c ON f.category_id = c.id
                    LEFT JOIN fb_sub_category sc ON f.sub_category_id = sc.id
                    LEFT JOIN fb_comment com ON com.feature_id = f.id
                      AND com.is_official = 1
                      AND com.is_visible = 1
                      AND com.hidden_at IS NULL
                      AND com.deleted_at IS NULL
                    WHERE 1 = 1 {feature_condition}
                    GROUP BY f.id
                    ORDER BY f.created_at DESC
                    """,
                    () if feature_id is None else (feature_id,),
                )
                rows = cast(list[dict[str, object]], await cursor.fetchall())
        finally:
            connection.close()
        return [self._to_document(row) for row in rows]

    def _to_document(self, row: dict[str, object]) -> Document:
        status_map = {"pending": "待評估", "developing": "開發中", "shipped": "已完成"}
        deleted_at = cast(datetime | None, row["deleted_at"])
        shipped_at = cast(datetime | None, row["shipped_at"])
        status = str(row["status"])
        category = str(row["category_name"] or "")
        sub_category = str(row["sub_category_name"] or "")
        lines = [
            f"標題：{row['title']}",
            f"分類：{category}{f' > {sub_category}' if sub_category else ''}",
            f"狀態：{status_map.get(status, status)}",
            f"點讚數：{row['like_count']}",
            f"評論數：{row['comment_count']}",
            f"資料狀態：{'已移至回收站（被刪除）' if deleted_at else '有效資料'}",
        ]
        if deleted_at:
            lines.append(f"刪除時間：{deleted_at.isoformat()}")
        lines.append(f"回收站評論數：{row['deleted_comment_count']}")
        if shipped_at:
            lines.append(f"上線時間：{shipped_at.isoformat()}")
        if row["version"]:
            lines.append(f"版本：{row['version']}")
        lines.append(f"描述：{row['description'] or ''}")
        if row["official_replies"]:
            lines.append(f"官方回覆：{row['official_replies']}")
        if row["deleted_comments"]:
            lines.append(f"回收站評論：{row['deleted_comments']}")

        return Document(
            text="\n".join(lines),
            metadata={
                "feature_id": int(cast(int, row["id"])),
                "category": row["category_name"],
                "comment_count": int(cast(int, row["comment_count"])),
                "deleted_at": deleted_at.isoformat() if deleted_at else None,
                "deleted_comment_count": int(cast(int, row["deleted_comment_count"])),
                "is_deleted": deleted_at is not None,
                "like_count": int(cast(int, row["like_count"])),
                "shipped_at": shipped_at.isoformat() if shipped_at else None,
                "status": status,
                "sub_category": row["sub_category_name"],
                "version": row["version"],
            },
        )

    async def claim_sync_jobs(self, limit: int) -> list[SyncJob]:
        connection = await self.connect()
        try:
            await connection.begin()
            async with connection.cursor(DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT feature_id, revision, attempts
                    FROM fb_aide_sync_job
                    WHERE available_at <= CURRENT_TIMESTAMP
                      AND (locked_at IS NULL OR locked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE))
                    ORDER BY available_at, feature_id
                    LIMIT %s
                    FOR UPDATE SKIP LOCKED
                    """,
                    (limit,),
                )
                rows = cast(list[dict[str, object]], await cursor.fetchall())
                for row in rows:
                    await cursor.execute(
                        "UPDATE fb_aide_sync_job SET locked_at = CURRENT_TIMESTAMP "
                        "WHERE feature_id = %s AND revision = %s",
                        (row["feature_id"], row["revision"]),
                    )
            await connection.commit()
        except Exception:
            await connection.rollback()
            raise
        finally:
            connection.close()
        return [
            SyncJob(
                attempts=int(cast(int | str, row["attempts"])),
                feature_id=int(cast(int | str, row["feature_id"])),
                revision=int(cast(int | str, row["revision"])),
            )
            for row in rows
        ]

    async def complete_sync_job(self, job: SyncJob) -> None:
        connection = await self.connect()
        try:
            async with connection.cursor(DictCursor) as cursor:
                await cursor.execute(
                    "DELETE FROM fb_aide_sync_job WHERE feature_id = %s AND revision = %s",
                    (job.feature_id, job.revision),
                )
                if cursor.rowcount == 0:
                    await cursor.execute(
                        "UPDATE fb_aide_sync_job SET locked_at = NULL WHERE feature_id = %s AND revision <> %s",
                        (job.feature_id, job.revision),
                    )
            await connection.commit()
        finally:
            connection.close()

    async def fail_sync_job(self, job: SyncJob, error: Exception) -> None:
        attempts = job.attempts + 1
        delay_seconds = min(2 ** min(attempts, 10) * 15, 3600)
        connection = await self.connect()
        try:
            async with connection.cursor(DictCursor) as cursor:
                await cursor.execute(
                    """
                    UPDATE fb_aide_sync_job
                    SET attempts = %s,
                        available_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL %s SECOND),
                        locked_at = NULL,
                        last_error = %s
                    WHERE feature_id = %s AND revision = %s
                    """,
                    (attempts, delay_seconds, str(error)[:2000], job.feature_id, job.revision),
                )
                if cursor.rowcount == 0:
                    await cursor.execute(
                        "UPDATE fb_aide_sync_job SET locked_at = NULL WHERE feature_id = %s AND revision <> %s",
                        (job.feature_id, job.revision),
                    )
            await connection.commit()
        finally:
            connection.close()
