from collections.abc import AsyncIterator

from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable
from langchain_openai import OpenAIEmbeddings

from feedback_ai.modules.base import AssistantModule, ModuleDescriptor
from feedback_ai.modules.feedback.config import FeedbackSettings
from feedback_ai.modules.feedback.mysql_source import MySQLSource
from feedback_ai.modules.feedback.prompt import ANSWER_PROMPT
from feedback_ai.modules.feedback.repository import FeedbackRepository
from feedback_ai.modules.feedback.retrieval import build_context, should_remember
from feedback_ai.modules.feedback.sync import FeedbackSyncService
from feedback_ai.schemas import ChatMessage
from feedback_ai.vector_store import PgVectorStore


class FeedbackModule(AssistantModule):
    """需求反馈模块的组合根，负责组装模型、仓储、检索和同步服务。"""

    descriptor = ModuleDescriptor(
        id="feedback",
        name="需求反馈",
        capabilities=frozenset({"chat", "ingest", "sync"}),
    )

    def __init__(self, settings: FeedbackSettings) -> None:
        """保存模块配置；外部客户端按实际调用延迟创建。"""

        self.settings = settings

    def repository(self) -> FeedbackRepository:
        """使用 LangChain Embeddings 组装需求反馈知识仓储。"""

        # OpenAI-compatible 服务通常不支持客户端 token 预切分，因此直接发送原始文本。
        embeddings = OpenAIEmbeddings.model_validate(
            {
                "model": self.settings.embedding_model,
                "api_key": self.settings.require_embedding_api_key(),
                "base_url": self.settings.embedding_base_url,
                "check_embedding_ctx_length": False,
            }
        )
        store = PgVectorStore(self.settings.require_postgres_url(), embeddings)
        return FeedbackRepository(store)

    def sync_service(self) -> FeedbackSyncService:
        """组装 MySQL Outbox 与 pgvector 之间的同步服务。"""

        return FeedbackSyncService(self.settings, MySQLSource(self.settings), self.repository())

    def answer_chain(self) -> Runnable[dict[str, object], str]:
        """构建支持逐 token 输出的 Prompt -> ChatModel -> 文本解析链。"""

        model = init_chat_model(
            self.settings.deepseek_model,
            model_provider="deepseek",
            api_key=self.settings.require_chat_api_key(),
            api_base=self.settings.deepseek_base_url,
            temperature=0,
        )
        return ANSWER_PROMPT | model | StrOutputParser()

    @staticmethod
    def history_messages(history: list[ChatMessage]) -> list[BaseMessage]:
        """将 HTTP 请求模型转换为 LangChain 原生消息对象。"""

        return [
            HumanMessage(content=message.content) if message.role == "user" else AIMessage(content=message.content)
            for message in history
        ]

    async def _stream_answer(
        self,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        """检索上下文、按需写入记忆，并流式执行 LangChain 回答链。"""

        repository = self.repository()
        await repository.ensure_schema()
        context = await build_context(question, user_id, repository, self.settings)
        if should_remember(question):
            await repository.remember(user_id, question)

        async for token in self.answer_chain().astream(
            {
                "context": context,
                "history": self.history_messages(history),
                "question": question,
            }
        ):
            if token:
                yield token

    def stream_answer(
        self,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        """返回惰性异步流，使模块校验可以在建立 SSE 前完成。"""

        return self._stream_answer(question, user_id, history)

    async def ingest(self) -> dict[str, int]:
        """执行需求反馈知识的全量重建。"""

        return await self.sync_service().ingest()

    async def process_pending_sync_jobs(self, limit: int) -> dict[str, int]:
        """消费指定数量的需求反馈 Outbox 任务。"""

        return await self.sync_service().process_pending_jobs(limit)
