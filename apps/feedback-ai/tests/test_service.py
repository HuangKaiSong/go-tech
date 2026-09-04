from collections.abc import AsyncIterator

import pytest

from feedback_ai.modules.base import AssistantModule, ModuleDescriptor, UnsupportedModuleCapabilityError
from feedback_ai.schemas import ChatMessage
from feedback_ai.service import AssistantService, UnknownModuleError


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


@pytest.mark.anyio
async def test_service_rejects_unsupported_module_capability() -> None:
    service = AssistantService([ChatOnlyModule()])

    with pytest.raises(UnsupportedModuleCapabilityError, match="ingest"):
        await service.ingest("example")
