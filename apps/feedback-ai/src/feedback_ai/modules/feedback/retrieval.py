import asyncio
import re
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timedelta

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from feedback_ai.modules.feedback.config import FeedbackSettings
from feedback_ai.modules.feedback.repository import (
    SOURCE_NAME,
    FeedbackQuery,
    FeedbackQueryResult,
    FeedbackRepository,
    FeedbackSystem,
)

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
SYSTEM_PATTERN = re.compile(r"(?<![a-z0-9_])(pms|hr)(?![a-z0-9_])", re.I)
SYSTEM_INTENT_PATTERN = re.compile(r"system|系统|系統|归属|歸屬", re.I)
CREATED_AT_INTENT_PATTERN = re.compile(
    r"created_at|创建时间|創建時間|建立时间|建立時間|提交时间|提交時間|新增时间|新增時間|创建于|創建於",
    re.I,
)
LATEST_PATTERN = re.compile(r"最新|最近|newest|latest", re.I)
EARLIEST_PATTERN = re.compile(r"最早|最初|oldest|earliest", re.I)
FULL_DATE_PATTERN = re.compile(r"(?<!\d)(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})(?:\s*[日号])?")
YEAR_MONTH_PATTERN = re.compile(r"(?<!\d)(20\d{2})\s*[-/.年]\s*(\d{1,2})(?:\s*月)?(?![-/.月\d])")
YEAR_PATTERN = re.compile(r"(?<!\d)(20\d{2})\s*年")
RECENT_DAYS_PATTERN = re.compile(r"(?:近|最近|过去|過去)\s*(\d{1,3})\s*天")
AFTER_INCLUSIVE_PATTERN = re.compile(r"不早于|不早於|大于等于|大於等於|>=|及以后|及以後")
AFTER_STRICT_PATTERN = re.compile(r"晚于|晚於|大于|大於|之后|之後|以后|以後|(?<![=>])>(?!=)")
BEFORE_INCLUSIVE_PATTERN = re.compile(r"不晚于|不晚於|小于等于|小於等於|<=|截至|截止")
BEFORE_STRICT_PATTERN = re.compile(r"早于|早於|小于|小於|之前|以前|(?<![=<])<(?!=)")

TEXT_SEPARATORS = ["\n\n", "\n", "。", "．", ".", "！", "？", "；", "，", "、", ",", " ", ""]


@dataclass(frozen=True, slots=True)
class CreatedAtFilter:
    """创建时间范围、排序方向及用于模型上下文的可读说明。"""

    start: datetime | None
    end: datetime | None
    descending: bool
    label: str


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


def extract_systems(question: str) -> tuple[FeedbackSystem, ...]:
    """提取 pms/hr 系统条件；泛问系统时同时查询两种已知系统。"""

    systems: list[FeedbackSystem] = []
    for match in SYSTEM_PATTERN.finditer(question):
        system = match.group(1).lower()
        normalized_system: FeedbackSystem = "pms" if system == "pms" else "hr"
        if normalized_system not in systems:
            systems.append(normalized_system)
    if systems:
        return tuple(systems)
    if SYSTEM_INTENT_PATTERN.search(question):
        return ("pms", "hr")
    return ()


def _next_month(value: datetime) -> datetime:
    """返回给定月份下一月的月初。"""

    return datetime(value.year + (value.month == 12), 1 if value.month == 12 else value.month + 1, 1)


def _apply_created_at_comparison(
    question: str,
    start: datetime,
    end: datetime,
    descending: bool,
    label: str,
) -> CreatedAtFilter:
    """把一个完整时间段转换为之前/之后的开区间或闭区间条件。"""

    if AFTER_INCLUSIVE_PATTERN.search(question):
        return CreatedAtFilter(start, None, descending, f"{label}及以后")
    if AFTER_STRICT_PATTERN.search(question):
        return CreatedAtFilter(end, None, descending, f"{label}之后")
    if BEFORE_INCLUSIVE_PATTERN.search(question):
        return CreatedAtFilter(None, end, descending, f"截至{label}")
    if BEFORE_STRICT_PATTERN.search(question):
        return CreatedAtFilter(None, start, descending, f"{label}之前")
    return CreatedAtFilter(start, end, descending, label)


def extract_created_at_filter(question: str, now: datetime | None = None) -> CreatedAtFilter | None:
    """解析创建时间日期范围、常用相对时间及最新/最早排序意图。"""

    current = now or datetime.now()
    today = datetime(current.year, current.month, current.day)
    descending = EARLIEST_PATTERN.search(question) is None

    recent_days = RECENT_DAYS_PATTERN.search(question)
    if recent_days:
        days = min(max(int(recent_days.group(1)), 1), 3660)
        return CreatedAtFilter(today - timedelta(days=days - 1), today + timedelta(days=1), True, f"最近 {days} 天")

    relative_periods: list[tuple[re.Pattern[str], datetime, datetime, str]] = [
        (re.compile(r"今天|今日"), today, today + timedelta(days=1), "今天"),
        (re.compile(r"昨天|昨日"), today - timedelta(days=1), today, "昨天"),
        (
            re.compile(r"本月|这个月|這個月"),
            datetime(today.year, today.month, 1),
            _next_month(datetime(today.year, today.month, 1)),
            "本月",
        ),
        (
            re.compile(r"上月|上个月|上個月"),
            _next_month(datetime(today.year, today.month, 1) - timedelta(days=32)),
            datetime(today.year, today.month, 1),
            "上月",
        ),
        (re.compile(r"今年|本年"), datetime(today.year, 1, 1), datetime(today.year + 1, 1, 1), "今年"),
        (re.compile(r"去年|上年"), datetime(today.year - 1, 1, 1), datetime(today.year, 1, 1), "去年"),
    ]
    for pattern, start, end, label in relative_periods:
        if pattern.search(question):
            return _apply_created_at_comparison(question, start, end, descending, label)

    full_dates: list[datetime] = []
    for year, month, day in FULL_DATE_PATTERN.findall(question):
        try:
            full_dates.append(datetime(int(year), int(month), int(day)))
        except ValueError:
            continue
    if full_dates:
        start = min(full_dates)
        end = (max(full_dates) if len(full_dates) > 1 else start) + timedelta(days=1)
        label = f"{start.date().isoformat()} 至 {(end - timedelta(days=1)).date().isoformat()}"
        return _apply_created_at_comparison(question, start, end, descending, label)

    year_month = YEAR_MONTH_PATTERN.search(question)
    if year_month:
        month_start: datetime | None
        try:
            month_start = datetime(int(year_month.group(1)), int(year_month.group(2)), 1)
        except ValueError:
            month_start = None
        if month_start:
            return _apply_created_at_comparison(
                question,
                month_start,
                _next_month(month_start),
                descending,
                f"{month_start.year}-{month_start.month:02d}",
            )

    year = YEAR_PATTERN.search(question)
    if year:
        start = datetime(int(year.group(1)), 1, 1)
        return _apply_created_at_comparison(
            question,
            start,
            datetime(start.year + 1, 1, 1),
            descending,
            f"{start.year} 年",
        )

    has_created_at_intent = (
        CREATED_AT_INTENT_PATTERN.search(question)
        or LATEST_PATTERN.search(question)
        or EARLIEST_PATTERN.search(question)
    )
    if has_created_at_intent:
        label = "按创建时间从新到旧" if descending else "按创建时间从旧到新"
        return CreatedAtFilter(None, None, descending, label)
    return None


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
        details = [f"feature_id={source}"]
        if system := document.metadata.get("system"):
            details.append(f"system={system}")
        if created_at := document.metadata.get("created_at"):
            details.append(f"created_at={created_at}")
        items.append(f"[{index}] ({', '.join(details)})\n{document.page_content}")
    return f"{title}：\n" + "\n\n".join(items)


def format_query_result(title: str, result: FeedbackQueryResult) -> str:
    """格式化精确查询，并显式提供不受 Top-K 限制的总数和系统分组统计。"""

    summary = f"共 {result.total} 条，PMS {result.pms_count} 条，HR {result.hr_count} 条"
    return format_documents(f"{title}（{summary}）", result.documents)


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
    systems = extract_systems(question)
    created_at_filter = extract_created_at_filter(question)
    metadata_query = FeedbackQuery(
        systems=systems,
        created_from=created_at_filter.start if created_at_filter else None,
        created_to=created_at_filter.end if created_at_filter else None,
        like_filter=like_filter if systems or created_at_filter else None,
        comment_filter=comment_filter if systems or created_at_filter else None,
        sort_by="comment_count" if comment_ranking else "created_at",
        descending=created_at_filter.descending if created_at_filter else True,
    )
    # 语义检索、长期记忆和适用的精确查询互不依赖，可以并行降低首 token 延迟。
    knowledge_task = (
        asyncio.create_task(repository.similarity_search_knowledge(question, settings.rag_knowledge_limit))
        if not trash_intent
        else None
    )
    memory_task = asyncio.create_task(repository.similarity_search_memory(question, user_id, settings.rag_memory_limit))
    metadata_task = (
        asyncio.create_task(repository.find_by_query(metadata_query)) if systems or created_at_filter else None
    )
    likes_task = (
        asyncio.create_task(repository.find_by_numeric_field("like_count", like_filter[0], like_filter[1]))
        if like_filter and metadata_task is None
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
        if (comment_filter or comment_ranking) and metadata_task is None
        else None
    )
    trash_task = asyncio.create_task(repository.find_trash()) if trash_intent else None

    # 统一在此等待任务，后续仅负责将结果组织成稳定的 Prompt 上下文。
    knowledge = await knowledge_task if knowledge_task else []
    memories = await memory_task
    metadata_result = await metadata_task if metadata_task else None
    likes = await likes_task if likes_task else []
    comments = await comments_task if comments_task else []
    trash = await trash_task if trash_task else None

    sections = [format_documents("知识库语义检索结果", knowledge)]
    if metadata_result:
        query_labels = []
        if systems:
            query_labels.append(f"system in ({', '.join(systems)})")
        if created_at_filter:
            query_labels.append(f"created_at: {created_at_filter.label}")
        if like_filter:
            query_labels.append(f"like_count {'>=' if like_filter[1] else '>'} {like_filter[0]}")
        if comment_filter:
            query_labels.append(f"comment_count {'>=' if comment_filter[1] else '>'} {comment_filter[0]}")
        if comment_ranking:
            query_labels.append("按 comment_count 排行")
        sections.append(format_query_result(f"metadata 精确查询结果（{'；'.join(query_labels)}）", metadata_result))
    if like_filter and metadata_task is None:
        comparator = ">=" if like_filter[1] else ">"
        sections.append(
            format_documents(
                f"按点赞数精确过滤结果（like_count {comparator} {like_filter[0]}）",
                likes,
            )
        )
    if (comment_filter or comment_ranking) and metadata_task is None:
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
