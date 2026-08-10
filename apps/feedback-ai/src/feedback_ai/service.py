from collections.abc import AsyncIterator

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam

from feedback_ai.config import Settings
from feedback_ai.mysql_source import MySQLSource
from feedback_ai.prompt import SYSTEM_PROMPT
from feedback_ai.retrieval import build_context, should_remember
from feedback_ai.schemas import ChatMessage
from feedback_ai.sync import FeedbackSyncService
from feedback_ai.vector_store import VectorStore


class FeedbackService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def vector_store(self) -> VectorStore:
        return VectorStore(self.settings)

    def sync_service(self) -> FeedbackSyncService:
        return FeedbackSyncService(self.settings, MySQLSource(self.settings), self.vector_store())

    async def stream_answer(
        self,
        question: str,
        user_id: str,
        history: list[ChatMessage],
    ) -> AsyncIterator[str]:
        store = self.vector_store()
        await store.ensure_schema()
        context = await build_context(question, user_id, store, self.settings)
        if should_remember(question):
            await store.remember(user_id, question)

        messages: list[ChatCompletionMessageParam] = [{"role": "system", "content": SYSTEM_PROMPT}]
        for message in history:
            if message.role == "user":
                messages.append({"role": "user", "content": message.content})
            else:
                messages.append({"role": "assistant", "content": message.content})
        messages.append(
            {
                "role": "user",
                "content": (
                    f"<retrieved-context>\n{context}\n</retrieved-context>\n\n"
                    f"<user-question>\n{question}\n</user-question>"
                ),
            }
        )

        client = AsyncOpenAI(
            api_key=self.settings.require_chat_api_key(),
            base_url=self.settings.deepseek_base_url,
        )
        stream = await client.chat.completions.create(
            model=self.settings.deepseek_model,
            messages=messages,
            temperature=0,
            stream=True,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content if chunk.choices else None
            if content:
                yield content

    async def ingest(self) -> dict[str, int]:
        return await self.sync_service().ingest()

    async def process_pending_sync_jobs(self, limit: int) -> dict[str, int]:
        return await self.sync_service().process_pending_jobs(limit)
