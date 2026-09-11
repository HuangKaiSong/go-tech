from collections.abc import AsyncIterator
from datetime import UTC, datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from feedback_ai.config import get_settings
from feedback_ai.conversation import Conversation, ConversationDetail
from feedback_ai.dependencies import get_assistant_service
from feedback_ai.main import create_app
from feedback_ai.modules.base import ModuleDescriptor
from feedback_ai.schemas import ChatMessage
from feedback_ai.service import PreparedChat, UnknownModuleError

CONVERSATION_ID = UUID("11111111-1111-4111-8111-111111111111")


def fake_conversation(message_count: int = 0) -> Conversation:
    timestamp = datetime(2026, 9, 4, tzinfo=UTC)
    return Conversation(
        id=CONVERSATION_ID,
        module_id="feedback",
        user_id="admin:1",
        title="哪些需求最受欢迎？",
        created_at=timestamp,
        updated_at=timestamp,
        message_count=message_count,
    )


class FakeService:
    def list_modules(self) -> list[ModuleDescriptor]:
        return [ModuleDescriptor("feedback", "需求反馈", frozenset({"chat", "ingest", "sync"}))]

    async def _stream_answer(self, question: str, user_id: str, history: list[object]) -> AsyncIterator[str]:
        assert question == "哪些需求最受欢迎？"
        assert user_id == "admin:1"
        assert history == []
        yield "第一段"
        yield "第二段"

    def stream_answer(self, module_id: str, question: str, user_id: str, history: list[object]) -> AsyncIterator[str]:
        if module_id != "feedback":
            raise UnknownModuleError(module_id)
        return self._stream_answer(question, user_id, history)

    async def prepare_chat(
        self,
        module_id: str,
        question: str,
        user_id: str,
        conversation_id: UUID | None,
        history: list[ChatMessage],
    ) -> PreparedChat:
        del question, user_id, conversation_id
        if module_id != "feedback":
            raise UnknownModuleError(module_id)
        return PreparedChat(fake_conversation(), history)

    async def save_exchange(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
        question: str,
        answer: str,
    ) -> None:
        assert (module_id, user_id, conversation_id) == ("feedback", "admin:1", CONVERSATION_ID)
        assert (question, answer) == ("哪些需求最受欢迎？", "第一段第二段")

    async def list_conversations(self, module_id: str, user_id: str, limit: int) -> list[Conversation]:
        assert (module_id, user_id, limit) == ("feedback", "admin:1", 50)
        return [fake_conversation(2)]

    async def conversation_detail(
        self,
        module_id: str,
        user_id: str,
        conversation_id: UUID,
    ) -> ConversationDetail:
        assert (module_id, user_id, conversation_id) == ("feedback", "admin:1", CONVERSATION_ID)
        return ConversationDetail(fake_conversation(2), [ChatMessage(role="user", content="第一问")])

    async def delete_conversation(self, module_id: str, user_id: str, conversation_id: UUID) -> None:
        assert (module_id, user_id, conversation_id) == ("feedback", "admin:1", CONVERSATION_ID)


def create_test_client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("FEEDBACK_AI_INTERNAL_TOKEN", "test-token")
    get_settings.cache_clear()
    app = create_app()
    app.dependency_overrides[get_assistant_service] = FakeService
    return TestClient(app)


def test_health_does_not_require_internal_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("FEEDBACK_AI_INTERNAL_TOKEN", raising=False)
    get_settings.cache_clear()

    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"service": "feedback-ai", "status": "ok"}


def test_chat_rejects_missing_internal_token(monkeypatch: pytest.MonkeyPatch) -> None:
    with create_test_client(monkeypatch) as client:
        response = client.post(
            "/v1/chat",
            json={"history": [], "question": "哪些需求最受欢迎？", "user_id": "admin:1"},
        )

    assert response.status_code == 401


def test_chat_streams_browser_sse_events(monkeypatch: pytest.MonkeyPatch) -> None:
    with create_test_client(monkeypatch) as client:
        response = client.post(
            "/v1/chat",
            headers={"X-Feedback-AI-Token": "test-token"},
            json={"history": [], "question": "哪些需求最受欢迎？", "user_id": "admin:1"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert 'data: {"type":"token","content":"第一段"}' in response.text
    assert 'data: {"type":"token","content":"第二段"}' in response.text
    assert f'data: {{"type":"conversation","conversation_id":"{CONVERSATION_ID}"' in response.text
    assert f'data: {{"type":"done","conversation_id":"{CONVERSATION_ID}"}}' in response.text


def test_module_route_and_discovery(monkeypatch: pytest.MonkeyPatch) -> None:
    with create_test_client(monkeypatch) as client:
        modules_response = client.get("/v1/modules", headers={"X-Feedback-AI-Token": "test-token"})
        chat_response = client.post(
            "/v1/modules/feedback/chat",
            headers={"X-Feedback-AI-Token": "test-token"},
            json={"history": [], "question": "哪些需求最受欢迎？", "user_id": "admin:1"},
        )

    assert modules_response.json() == [
        {"id": "feedback", "name": "需求反馈", "capabilities": ["chat", "ingest", "sync"]}
    ]
    assert chat_response.status_code == 200
    assert 'data: {"type":"done"' in chat_response.text


def test_conversation_history_endpoints(monkeypatch: pytest.MonkeyPatch) -> None:
    headers = {"X-Feedback-AI-Token": "test-token"}
    with create_test_client(monkeypatch) as client:
        list_response = client.get("/v1/modules/feedback/conversations?user_id=admin:1", headers=headers)
        detail_response = client.get(
            f"/v1/modules/feedback/conversations/{CONVERSATION_ID}?user_id=admin:1",
            headers=headers,
        )
        delete_response = client.delete(
            f"/v1/modules/feedback/conversations/{CONVERSATION_ID}?user_id=admin:1",
            headers=headers,
        )

    assert list_response.status_code == 200
    assert list_response.json()[0]["message_count"] == 2
    assert detail_response.json()["messages"] == [{"role": "user", "content": "第一问"}]
    assert delete_response.json() == {"deleted": True, "id": str(CONVERSATION_ID)}


def test_unknown_module_returns_not_found_before_starting_sse(monkeypatch: pytest.MonkeyPatch) -> None:
    with create_test_client(monkeypatch) as client:
        response = client.post(
            "/v1/modules/unknown/chat",
            headers={"X-Feedback-AI-Token": "test-token"},
            json={"history": [], "question": "问题", "user_id": "admin:1"},
        )

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")
