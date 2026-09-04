from collections.abc import AsyncIterator

from feedback_ai.modules import AssistantModule, ModuleDescriptor, create_modules
from feedback_ai.modules.base import UnsupportedModuleCapabilityError
from feedback_ai.schemas import ChatMessage

DEFAULT_MODULE_ID = "feedback"


class UnknownModuleError(LookupError):
    """请求的模块 ID 未在当前服务中注册。"""

    def __init__(self, module_id: str) -> None:
        super().__init__(f"Unknown assistant module: {module_id}")
        self.module_id = module_id


class AssistantService:
    """模块注册表与统一分发入口，不承载具体业务知识。"""

    def __init__(self, modules: list[AssistantModule] | None = None) -> None:
        """建立模块索引，并在启动阶段拒绝重复 ID。"""

        registered_modules = modules if modules is not None else create_modules()
        self._modules: dict[str, AssistantModule] = {}
        for module in registered_modules:
            module_id = module.descriptor.id
            if module_id in self._modules:
                raise ValueError(f"Duplicate assistant module: {module_id}")
            self._modules[module_id] = module

    def list_modules(self) -> list[ModuleDescriptor]:
        """返回已注册模块的公开描述，供发现接口使用。"""

        return [module.descriptor for module in self._modules.values()]

    def require_module(self, module_id: str) -> AssistantModule:
        """按 ID 获取模块，未注册时抛出可映射为 HTTP 404 的错误。"""

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
        """校验聊天能力后，把流式回答委托给目标模块。"""

        module = self.require_module(module_id)
        module.require_capability("chat")
        return module.stream_answer(question, user_id, history)

    async def ingest(self, module_id: str) -> dict[str, int]:
        """校验导入能力后执行目标模块的全量知识导入。"""

        module = self.require_module(module_id)
        module.require_capability("ingest")
        return await module.ingest()

    async def process_pending_sync_jobs(self, module_id: str, limit: int) -> dict[str, int]:
        """校验同步能力后消费目标模块的增量任务。"""

        module = self.require_module(module_id)
        module.require_capability("sync")
        return await module.process_pending_sync_jobs(limit)


__all__ = [
    "DEFAULT_MODULE_ID",
    "AssistantService",
    "UnknownModuleError",
    "UnsupportedModuleCapabilityError",
]
