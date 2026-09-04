from collections.abc import AsyncIterator

from feedback_ai.modules import AssistantModule, ModuleDescriptor, create_modules
from feedback_ai.modules.base import UnsupportedModuleCapabilityError
from feedback_ai.schemas import ChatMessage

DEFAULT_MODULE_ID = "feedback"


class UnknownModuleError(LookupError):
    def __init__(self, module_id: str) -> None:
        super().__init__(f"Unknown assistant module: {module_id}")
        self.module_id = module_id


class AssistantService:
    def __init__(self, modules: list[AssistantModule] | None = None) -> None:
        registered_modules = modules if modules is not None else create_modules()
        self._modules: dict[str, AssistantModule] = {}
        for module in registered_modules:
            module_id = module.descriptor.id
            if module_id in self._modules:
                raise ValueError(f"Duplicate assistant module: {module_id}")
            self._modules[module_id] = module

    def list_modules(self) -> list[ModuleDescriptor]:
        return [module.descriptor for module in self._modules.values()]

    def require_module(self, module_id: str) -> AssistantModule:
        try:
            return self._modules[module_id]
        except KeyError as error:
            raise UnknownModuleError(module_id) from error

    def stream_answer(
        self,
        module_id: str,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        module = self.require_module(module_id)
        module.require_capability("chat")
        return module.stream_answer(question, user_id, history)

    async def ingest(self, module_id: str) -> dict[str, int]:
        module = self.require_module(module_id)
        module.require_capability("ingest")
        return await module.ingest()

    async def process_pending_sync_jobs(self, module_id: str, limit: int) -> dict[str, int]:
        module = self.require_module(module_id)
        module.require_capability("sync")
        return await module.process_pending_sync_jobs(limit)


__all__ = [
    "DEFAULT_MODULE_ID",
    "AssistantService",
    "UnknownModuleError",
    "UnsupportedModuleCapabilityError",
]
