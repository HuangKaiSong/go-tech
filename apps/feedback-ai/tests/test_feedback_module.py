from collections.abc import AsyncIterator
from typing import cast

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import Runnable

from feedback_ai.modules.feedback import module as feedback_module_source
from feedback_ai.modules.feedback.config import FeedbackSettings
from feedback_ai.modules.feedback.module import FeedbackModule
from feedback_ai.modules.feedback.repository import FeedbackRepository
from feedback_ai.schemas import ChatMessage


class FakeRepository:
    def __init__(self) -> None:
        self.remembered: tuple[str, str] | None = None

    async def ensure_schema(self) -> None:
        return None

    async def remember(self, user_id: str, content: str) -> None:
        self.remembered = (user_id, content)


class FakeChain:
    def __init__(self) -> None:
        self.input: dict[str, object] | None = None

    async def astream(self, input: dict[str, object]) -> AsyncIterator[str]:
        self.input = input
        yield "第一段"
        yield "第二段"


@pytest.mark.anyio
async def test_feedback_module_streams_langchain_runnable_with_history(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    repository = FakeRepository()
    chain = FakeChain()
    module = FeedbackModule(FeedbackSettings())

    async def fake_build_context(
        question: str,
        user_id: str,
        target: FeedbackRepository,
        settings: FeedbackSettings,
        *,
        use_semantic_knowledge: bool,
    ) -> str:
        del target, settings
        assert question == "请记住这个需求"
        assert user_id == "admin:1"
        assert use_semantic_knowledge is True
        return "检索上下文"

    monkeypatch.setattr(feedback_module_source, "build_context", fake_build_context)
    monkeypatch.setattr(module, "repository", lambda: cast(FeedbackRepository, repository))
    monkeypatch.setattr(module, "answer_chain", lambda: cast(Runnable[dict[str, object], str], chain))

    tokens = [
        token
        async for token in module.stream_answer(
            "请记住这个需求",
            "admin:1",
            [ChatMessage(role="user", content="上一问"), ChatMessage(role="assistant", content="上一答")],
        )
    ]

    assert tokens == ["第一段", "第二段"]
    assert repository.remembered == ("admin:1", "请记住这个需求")
    assert chain.input is not None
    assert chain.input["context"] == "检索上下文"
    assert isinstance(cast(list[object], chain.input["history"])[0], HumanMessage)
    assert isinstance(cast(list[object], chain.input["history"])[1], AIMessage)


def test_feedback_module_reuses_history_for_contextual_follow_up() -> None:
    history = [ChatMessage(role="assistant", content="上一轮列出了三个需求")]

    assert FeedbackModule.uses_semantic_knowledge("这些需求有什么共同点？", history) is False
    assert FeedbackModule.uses_semantic_knowledge("请重新搜索登录相关需求", history) is True
