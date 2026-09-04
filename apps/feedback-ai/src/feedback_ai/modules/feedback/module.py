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
    descriptor = ModuleDescriptor(
        id="feedback",
        name="需求反馈",
        capabilities=frozenset({"chat", "ingest", "sync"}),
    )

    def __init__(self, settings: FeedbackSettings) -> None:
        self.settings = settings

    def repository(self) -> FeedbackRepository:
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
        return FeedbackSyncService(self.settings, MySQLSource(self.settings), self.repository())

    def answer_chain(self) -> Runnable[dict[str, object], str]:
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
        return self._stream_answer(question, user_id, history)

    async def ingest(self) -> dict[str, int]:
        return await self.sync_service().ingest()

    async def process_pending_sync_jobs(self, limit: int) -> dict[str, int]:
        return await self.sync_service().process_pending_jobs(limit)
