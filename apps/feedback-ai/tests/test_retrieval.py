from datetime import datetime

import pytest

from feedback_ai.modules.feedback.retrieval import (
    extract_created_at_filter,
    extract_numeric_filter,
    extract_systems,
    split_text,
)


@pytest.mark.parametrize(
    ("question", "field", "expected"),
    [
        ("点赞大于 10 的需求", "like_count", (10, False)),
        ("like_count >= 5", "like_count", (5, True)),
        ("评论数至少 3 条", "comment_count", (3, True)),
        ("按评论数排行", "comment_count", None),
    ],
)
def test_extract_numeric_filter(question: str, field: str, expected: tuple[int, bool] | None) -> None:
    assert extract_numeric_filter(question, field) == expected


def test_split_text_preserves_overlap() -> None:
    chunks = split_text("abcdefghij", chunk_size=6, chunk_overlap=2)

    assert chunks == ["abcdef", "efghij"]


def test_split_text_rejects_invalid_overlap() -> None:
    with pytest.raises(ValueError, match="chunk_overlap"):
        split_text("text", chunk_size=4, chunk_overlap=4)


@pytest.mark.parametrize(
    ("question", "expected"),
    [
        ("列出 HR 系统的需求", ("hr",)),
        ("比较 PMS 和 hr 的需求", ("pms", "hr")),
        ("这些需求分别属于什么系统？", ("pms", "hr")),
        ("普通需求问题", ()),
    ],
)
def test_extract_systems(question: str, expected: tuple[str, ...]) -> None:
    assert extract_systems(question) == expected


@pytest.mark.parametrize(
    ("question", "expected_start", "expected_end", "descending"),
    [
        ("2026年9月创建的需求", datetime(2026, 9, 1), datetime(2026, 10, 1), True),
        ("2026-09-03 到 2026-09-05 的需求", datetime(2026, 9, 3), datetime(2026, 9, 6), True),
        ("今年最早创建的需求", datetime(2026, 1, 1), datetime(2027, 1, 1), False),
        ("最近 7 天新增的需求", datetime(2026, 8, 29), datetime(2026, 9, 5), True),
    ],
)
def test_extract_created_at_filter(
    question: str,
    expected_start: datetime,
    expected_end: datetime,
    descending: bool,
) -> None:
    result = extract_created_at_filter(question, now=datetime(2026, 9, 4, 12))

    assert result is not None
    assert result.start == expected_start
    assert result.end == expected_end
    assert result.descending is descending


def test_extract_created_at_filter_supports_sort_without_range() -> None:
    result = extract_created_at_filter("最新创建的需求")

    assert result is not None
    assert result.start is None
    assert result.end is None
    assert result.descending is True


@pytest.mark.parametrize(
    ("question", "expected_start", "expected_end"),
    [
        ("created_at >= 2026-09-03", datetime(2026, 9, 3), None),
        ("2026年之后创建的需求", datetime(2027, 1, 1), None),
        ("2026-09-03 之前创建的需求", None, datetime(2026, 9, 3)),
        ("截至 2026-09-03 的需求", None, datetime(2026, 9, 4)),
    ],
)
def test_extract_created_at_filter_supports_comparisons(
    question: str,
    expected_start: datetime | None,
    expected_end: datetime | None,
) -> None:
    result = extract_created_at_filter(question)

    assert result is not None
    assert result.start == expected_start
    assert result.end == expected_end


def test_extract_created_at_filter_ignores_invalid_date() -> None:
    assert extract_created_at_filter("2026-99-99 的需求") is None
