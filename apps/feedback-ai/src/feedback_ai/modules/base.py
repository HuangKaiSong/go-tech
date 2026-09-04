from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

from feedback_ai.schemas import ChatMessage

ModuleCapability = Literal["chat", "ingest", "sync"]


@dataclass(frozen=True, slots=True)
class ModuleDescriptor:
    """描述一个可注册 AI 模块及其对外开放的能力。"""

    id: str
    name: str
    capabilities: frozenset[ModuleCapability]


class UnsupportedModuleCapabilityError(RuntimeError):
    """模块存在，但调用方请求了它未声明的能力。"""

    def __init__(self, module_id: str, capability: ModuleCapability) -> None:
        super().__init__(f"Module {module_id!r} does not support {capability!r}")
        self.module_id = module_id
        self.capability = capability


class AssistantModule:
    """所有业务 AI 模块需要遵循的最小契约。"""

    descriptor: ModuleDescriptor

    def require_capability(self, capability: ModuleCapability) -> None:
        """在执行操作前校验模块是否显式声明了对应能力。"""

        if capability not in self.descriptor.capabilities:
            raise UnsupportedModuleCapabilityError(self.descriptor.id, capability)

    def stream_answer(
        self,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        """以异步迭代器返回回答片段，供 SSE 层逐块发送。"""

        self.require_capability("chat")
        raise NotImplementedError

    async def ingest(self) -> dict[str, int]:
        """全量导入模块知识；支持该能力的模块必须覆盖此方法。"""

        raise NotImplementedError

    async def process_pending_sync_jobs(self, limit: int) -> dict[str, int]:
        """消费模块增量同步任务；支持该能力的模块必须覆盖此方法。"""

        del limit
        raise NotImplementedError
