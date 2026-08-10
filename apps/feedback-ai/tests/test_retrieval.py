import pytest

from feedback_ai.retrieval import extract_numeric_filter, split_text


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
