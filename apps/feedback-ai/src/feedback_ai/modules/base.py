from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

from feedback_ai.schemas import ChatMessage

ModuleCapability = Literal["chat", "ingest", "sync"]


@dataclass(frozen=True, slots=True)
class ModuleDescriptor:
    id: str
    name: str
    capabilities: frozenset[ModuleCapability]


class UnsupportedModuleCapabilityError(RuntimeError):
    def __init__(self, module_id: str, capability: ModuleCapability) -> None:
        super().__init__(f"Module {module_id!r} does not support {capability!r}")
        self.module_id = module_id
        self.capability = capability


class AssistantModule:
    descriptor: ModuleDescriptor

    def require_capability(self, capability: ModuleCapability) -> None:
        if capability not in self.descriptor.capabilities:
            raise UnsupportedModuleCapabilityError(self.descriptor.id, capability)

    def stream_answer(
        self,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        self.require_capability("chat")
        raise NotImplementedError

    async def ingest(self) -> dict[str, int]:
        raise NotImplementedError

    async def process_pending_sync_jobs(self, limit: int) -> dict[str, int]:
        del limit
        raise NotImplementedError
