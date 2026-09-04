import asyncio
import re
from collections.abc import Iterable

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from feedback_ai.modules.feedback.config import FeedbackSettings
from feedback_ai.modules.feedback.repository import SOURCE_NAME, FeedbackRepository

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

TEXT_SEPARATORS = ["\n\n", "\n", "。", "．", ".", "！", "？", "；", "，", "、", ",", " ", ""]


def extract_numeric_filter(question: str, field: str) -> tuple[int, bool] | None:
    """从自然语言问题中提取点赞数或评论数的阈值条件。"""

    pattern = LIKE_PATTERN if field == "like_count" else COMMENT_PATTERN
    match = pattern.search(question)
    if match is None:
        return None
    inclusive = match.group(1) in {"至少", "不低于", "不低於", ">="}
    return int(match.group(2)), inclusive


def asks_about_trash(question: str) -> bool:
    """判断用户是否明确询问回收站或已删除内容。"""

    return TRASH_PATTERN.search(question) is not None


def asks_for_comment_ranking(question: str) -> bool:
    """判断用户是否要求按评论数进行排行。"""

    return COMMENT_RANKING_PATTERN.search(question) is not None


def should_remember(question: str) -> bool:
    """只接受显式记忆意图，并阻止敏感凭据进入长期记忆。"""

    return REMEMBER_PATTERN.search(question) is not None and SENSITIVE_PATTERN.search(question) is None


def create_text_splitter(chunk_size: int, chunk_overlap: int) -> RecursiveCharacterTextSplitter:
    """创建包含中英文标点分隔符的 LangChain 递归分片器。"""

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be non-negative and smaller than chunk_size")
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=TEXT_SEPARATORS,
        is_separator_regex=False,
    )


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """切分单段文本，空白输入不产生切片。"""

    normalized = text.strip()
    if not normalized:
        return []
    return create_text_splitter(chunk_size, chunk_overlap).split_text(normalized)


def split_documents(
    documents: Iterable[Document],
    settings: FeedbackSettings,
    sync_version: str,
) -> list[Document]:
    """切分文档并附加可用于增量替换的来源、序号和同步版本。"""

    splitter = create_text_splitter(settings.rag_chunk_size, settings.rag_chunk_overlap)
    chunks: list[Document] = []
    for document in documents:
        for index, chunk in enumerate(splitter.split_documents([document])):
            chunks.append(
                Document(
                    page_content=chunk.page_content,
                    metadata={
                        **chunk.metadata,
                        "chunk_index": index,
                        "source": SOURCE_NAME,
                        "sync_version": sync_version,
                    },
                )
            )
    return chunks


def format_documents(title: str, documents: list[Document]) -> str:
    """把检索文档格式化为带 feature_id 的模型上下文片段。"""

    if not documents:
        return f"{title}：无"
    items = []
    for index, document in enumerate(documents, start=1):
        source = document.metadata.get("feature_id", document.metadata.get("source", "unknown"))
        items.append(f"[{index}] (feature_id={source})\n{document.page_content}")
    return f"{title}：\n" + "\n\n".join(items)


async def build_context(
    question: str,
    user_id: str,
    repository: FeedbackRepository,
    settings: FeedbackSettings,
) -> str:
    """根据问题意图并行组合语义检索、精确查询和用户记忆。"""

    like_filter = extract_numeric_filter(question, "like_count")
    comment_filter = extract_numeric_filter(question, "comment_count")
    trash_intent = asks_about_trash(question)
    comment_ranking = asks_for_comment_ranking(question)

    # 语义检索、长期记忆和适用的精确查询互不依赖，可以并行降低首 token 延迟。
    knowledge_task = (
        asyncio.create_task(repository.similarity_search_knowledge(question, settings.rag_knowledge_limit))
        if not trash_intent
        else None
    )
    memory_task = asyncio.create_task(repository.similarity_search_memory(question, user_id, settings.rag_memory_limit))
    likes_task = (
        asyncio.create_task(repository.find_by_numeric_field("like_count", like_filter[0], like_filter[1]))
        if like_filter
        else None
    )
    comments_task = (
        asyncio.create_task(
            repository.find_by_numeric_field(
                "comment_count",
                comment_filter[0] if comment_filter else 0,
                comment_filter[1] if comment_filter else False,
            )
        )
        if comment_filter or comment_ranking
        else None
    )
    trash_task = asyncio.create_task(repository.find_trash()) if trash_intent else None

    # 统一在此等待任务，后续仅负责将结果组织成稳定的 Prompt 上下文。
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
