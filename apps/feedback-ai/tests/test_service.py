from collections.abc import AsyncIterator

import pytest

from feedback_ai.modules.base import AssistantModule, ModuleDescriptor, UnsupportedModuleCapabilityError
from feedback_ai.schemas import ChatMessage
from feedback_ai.service import (
    CHAT_HISTORY_MAX_CHARACTERS,
    CHAT_HISTORY_MAX_CHARACTERS_PER_MESSAGE,
    CHAT_HISTORY_MAX_MESSAGES,
    AssistantService,
    UnknownModuleError,
)


class ChatOnlyModule(AssistantModule):
    descriptor = ModuleDescriptor("example", "示例模块", frozenset({"chat"}))

    async def _stream(self) -> AsyncIterator[str]:
        yield "ok"

    def stream_answer(
        self,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        del question, user_id, history
        return self._stream()


def test_service_registers_independent_modules() -> None:
    service = AssistantService([ChatOnlyModule()])

    assert service.list_modules() == [ChatOnlyModule.descriptor]
    assert service.require_module("example").descriptor.name == "示例模块"


def test_service_rejects_duplicate_and_unknown_modules() -> None:
    with pytest.raises(ValueError, match="Duplicate assistant module"):
        AssistantService([ChatOnlyModule(), ChatOnlyModule()])

    with pytest.raises(UnknownModuleError, match="unknown"):
        AssistantService([ChatOnlyModule()]).require_module("unknown")


def test_service_compacts_history_for_follow_up_prompt() -> None:
    history = [
        ChatMessage(role="user" if index % 2 == 0 else "assistant", content=str(index) * 7_000) for index in range(10)
    ]

    compacted = AssistantService.compact_history(history)

    assert len(compacted) <= CHAT_HISTORY_MAX_MESSAGES
    assert sum(len(message.content) for message in compacted) <= CHAT_HISTORY_MAX_CHARACTERS
    assert all(len(message.content) <= CHAT_HISTORY_MAX_CHARACTERS_PER_MESSAGE for message in compacted)
    assert compacted[-1].content.startswith("9")


@pytest.mark.anyio
async def test_service_rejects_unsupported_module_capability() -> None:
    service = AssistantService([ChatOnlyModule()])

    with pytest.raises(UnsupportedModuleCapabilityError, match="ingest"):
        await service.ingest("example")
