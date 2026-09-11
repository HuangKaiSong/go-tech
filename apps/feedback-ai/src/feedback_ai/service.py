from collections.abc import AsyncIterator
from dataclasses import dataclass
from uuid import UUID

from feedback_ai.conversation import Conversation, ConversationDetail, ConversationRepository
from feedback_ai.modules import AssistantModule, ModuleDescriptor, create_modules
from feedback_ai.modules.base import UnsupportedModuleCapabilityError
from feedback_ai.schemas import ChatMessage

DEFAULT_MODULE_ID = "feedback"
CHAT_HISTORY_MAX_MESSAGES = 8
CHAT_HISTORY_MAX_CHARACTERS = 12_000
CHAT_HISTORY_MAX_CHARACTERS_PER_MESSAGE = 6_000


@dataclass(frozen=True, slots=True)
class PreparedChat:
    """完成归属校验并装载历史后的聊天执行参数。"""

    conversation: Conversation
    history: list[ChatMessage]


class UnknownModuleError(LookupError):
    """请求的模块 ID 未在当前服务中注册。"""

    def __init__(self, module_id: str) -> None:
        super().__init__(f"Unknown assistant module: {module_id}")
        self.module_id = module_id


class AssistantService:
    """模块注册表与统一分发入口，不承载具体业务知识。"""

    def __init__(
        self,
        modules: list[AssistantModule] | None = None,
        conversation_repository: ConversationRepository | None = None,
    ) -> None:
        """建立模块索引，并在启动阶段拒绝重复 ID。"""

        registered_modules = modules if modules is not None else create_modules()
        self._modules: dict[str, AssistantModule] = {}
        for module in registered_modules:
            module_id = module.descriptor.id
            if module_id in self._modules:
                raise ValueError(f"Duplicate assistant module: {module_id}")
            self._modules[module_id] = module
        self._conversation_repository = conversation_repository

    def conversation_repository(self) -> ConversationRepository:
        """返回平台级会话仓储；命令行等无持久化入口不会初始化它。"""

        if self._conversation_repository is None:
            raise RuntimeError("Conversation repository is not configured")
        return self._conversation_repository

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

    @staticmethod
    def compact_history(history: list[ChatMessage]) -> list[ChatMessage]:
        """限制历史消息数量和字符预算，避免追问时模型预填充时间持续增长。"""

        remaining = CHAT_HISTORY_MAX_CHARACTERS
        selected: list[ChatMessage] = []
        for message in reversed(history[-CHAT_HISTORY_MAX_MESSAGES:]):
            if remaining <= 0:
                break
            content = message.content[: min(CHAT_HISTORY_MAX_CHARACTERS_PER_MESSAGE, remaining)].strip()
            if not content:
                continue
            selected.append(ChatMessage(role=message.role, content=content))
            remaining -= len(content)
        selected.reverse()
        return selected

    async def prepare_chat(
        self,
        module_id: str,
        question: str,
        user_id: str,
        conversation_id: UUID | None,
        fallback_history: list[ChatMessage],
    ) -> PreparedChat:
        """创建或校验会话，并从服务端读取模型所需的最近 16 条历史。"""

        module = self.require_module(module_id)
        module.require_capability("chat")
        repository = self.conversation_repository()
        if conversation_id:
            detail = await repository.load_for_chat(
                module_id,
                user_id,
                conversation_id,
                CHAT_HISTORY_MAX_MESSAGES,
            )
            conversation = detail.conversation
            history = detail.messages
        else:
            conversation = await repository.create(module_id, user_id, question)
            # 新会话没有数据库历史，旧调用方传入的上下文仍可参与本轮回答。
            history = fallback_history
        # fallback_history 只服务于旧调用方；持久化会话已有消息时以数据库为事实来源。
        if not history and fallback_history:
            history = fallback_history
        return PreparedChat(conversation=conversation, history=self.compact_history(history))

    async def save_exchange(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
        question: str,
        answer: str,
    ) -> None:
        """仅在模型正常结束后保存完整的一问一答。"""

        await self.conversation_repository().append_exchange(
            module_id,
            user_id,
            conversation_id,
            question,
            answer,
        )

    async def list_conversations(self, module_id: str, user_id: str, limit: int) -> list[Conversation]:
        """列出当前模块和用户的历史会话。"""

        self.require_module(module_id).require_capability("chat")
        return await self.conversation_repository().list_conversations(module_id, user_id, limit)

    async def conversation_detail(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
    ) -> ConversationDetail:
        """读取单个会话及其消息。"""

        self.require_module(module_id).require_capability("chat")
        return await self.conversation_repository().detail(module_id, user_id, conversation_id)

    async def delete_conversation(self, module_id: str, user_id: str, conversation_id: UUID) -> None:
        """删除属于当前模块和用户的会话。"""

        self.require_module(module_id).require_capability("chat")
        await self.conversation_repository().delete(module_id, user_id, conversation_id)

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
