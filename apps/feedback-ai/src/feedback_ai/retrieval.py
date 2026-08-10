import asyncio
import re
from collections.abc import Iterable

from feedback_ai.config import Settings
from feedback_ai.documents import Document
from feedback_ai.vector_store import VectorStore

LIKE_PATTERN = re.compile(
    r"(?:like_count|点赞|點讚|赞数|讚數|讚好數)[^\d<>]{0,10}"
    r"(大于|大於|超过|超過|高于|高於|至少|不低于|不低於|>=|>)\s*(\d+)",
    re.IGNORECASE,
)
COMMENT_PATTERN = re.compile(
    r"(?:comment_count|评论数|評論數|评论|評論)[^\d<>]{0,10}"
    r"(大于|大於|超过|超過|高于|高於|至少|不低于|不低於|>=|>)\s*(\d+)",
    re.IGNORECASE,
)
TRASH_PATTERN = re.compile(r"回收站|垃圾桶|已刪除|已删除|被刪除|被删除|軟刪除|软删除|deleted|trash|recycle\s*bin", re.I)
COMMENT_RANKING_PATTERN = re.compile(r"评论数|評論數|comment_count|评论排行|評論排行", re.I)
REMEMBER_PATTERN = re.compile(r"请记住|請記住|帮我记住|幫我記住|记住这个|記住這個", re.I)
SENSITIVE_PATTERN = re.compile(r"password|passwd|api[ _-]?key|token|密钥|密碼|密码|银行卡|銀行卡", re.I)


def extract_numeric_filter(question: str, field: str) -> tuple[int, bool] | None:
    pattern = LIKE_PATTERN if field == "like_count" else COMMENT_PATTERN
    match = pattern.search(question)
    if match is None:
        return None
    inclusive = match.group(1) in {"至少", "不低于", "不低於", ">="}
    return int(match.group(2)), inclusive


def asks_about_trash(question: str) -> bool:
    return TRASH_PATTERN.search(question) is not None


def asks_for_comment_ranking(question: str) -> bool:
    return COMMENT_RANKING_PATTERN.search(question) is not None


def should_remember(question: str) -> bool:
    return REMEMBER_PATTERN.search(question) is not None and SENSITIVE_PATTERN.search(question) is None


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be non-negative and smaller than chunk_size")
    normalized = text.strip()
    if not normalized:
        return []

    step = chunk_size - chunk_overlap
    chunks: list[str] = []
    for start in range(0, len(normalized), step):
        chunks.append(normalized[start : start + chunk_size])
        if start + chunk_size >= len(normalized):
            break
    return chunks


def split_documents(documents: Iterable[Document], settings: Settings, sync_version: str) -> list[Document]:
    chunks: list[Document] = []
    for document in documents:
        for index, text in enumerate(split_text(document.text, settings.rag_chunk_size, settings.rag_chunk_overlap)):
            chunks.append(
                Document(
                    text=text,
                    metadata={
                        **document.metadata,
                        "chunk_index": index,
                        "source": "mysql_feature",
                        "sync_version": sync_version,
                    },
                )
            )
    return chunks


def format_documents(title: str, documents: list[Document]) -> str:
    if not documents:
        return f"{title}：无"
    items = []
    for index, document in enumerate(documents, start=1):
        source = document.metadata.get("feature_id", document.metadata.get("source", "unknown"))
        items.append(f"[{index}] (feature_id={source})\n{document.text}")
    return f"{title}：\n" + "\n\n".join(items)


async def build_context(question: str, user_id: str, store: VectorStore, settings: Settings) -> str:
    like_filter = extract_numeric_filter(question, "like_count")
    comment_filter = extract_numeric_filter(question, "comment_count")
    trash_intent = asks_about_trash(question)
    comment_ranking = asks_for_comment_ranking(question)

    knowledge_task = (
        asyncio.create_task(
            store.similarity_search(
                "aide_knowledge",
                question,
                settings.rag_knowledge_limit,
                {"is_deleted": False},
            )
        )
        if not trash_intent
        else None
    )
    memory_task = asyncio.create_task(
        store.similarity_search("aide_long_term_memory", question, settings.rag_memory_limit, {"user_id": user_id})
    )
    likes_task = (
        asyncio.create_task(store.find_by_numeric_field("like_count", like_filter[0], like_filter[1]))
        if like_filter
        else None
    )
    comments_task = (
        asyncio.create_task(
            store.find_by_numeric_field(
                "comment_count",
                comment_filter[0] if comment_filter else 0,
                comment_filter[1] if comment_filter else False,
            )
        )
        if comment_filter or comment_ranking
        else None
    )
    trash_task = asyncio.create_task(store.find_trash()) if trash_intent else None

    knowledge = await knowledge_task if knowledge_task else []
    memories = await memory_task
    likes = await likes_task if likes_task else []
    comments = await comments_task if comments_task else []
    trash = await trash_task if trash_task else None

    sections = [format_documents("知识库语义检索结果", knowledge)]
    if like_filter:
        comparator = ">=" if like_filter[1] else ">"
        sections.append(
            format_documents(
                f"按点赞数精确过滤结果（like_count {comparator} {like_filter[0]}）",
                likes,
            )
        )
    if comment_filter or comment_ranking:
        label = (
            f"comment_count {'>=' if comment_filter and comment_filter[1] else '>'} {comment_filter[0]}"
            if comment_filter
            else "comment_count 排行"
        )
        sections.append(format_documents(f"按评论数精确过滤结果（{label}）", comments))
    if trash:
        sections.append(
            format_documents(
                f"回收站精确结果（共 {trash.total} 条：被删除需求 {trash.deleted_features} 条、"
                f"被删除评论 {trash.deleted_comments} 条）",
                trash.documents,
            )
        )
    sections.append(format_documents("与当前用户相关的长期记忆", memories))
    return "\n\n".join(sections)
