from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from feedback_ai.config import get_settings
from feedback_ai.dependencies import get_feedback_service
from feedback_ai.main import create_app


class FakeService:
    async def stream_answer(self, question: str, user_id: str, history: list[object]) -> AsyncIterator[str]:
        assert question == "哪些需求最受欢迎？"
        assert user_id == "admin:1"
        assert history == []
        yield "第一段"
        yield "第二段"


def create_test_client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("FEEDBACK_AI_INTERNAL_TOKEN", "test-token")
    get_settings.cache_clear()
    app = create_app()
    app.dependency_overrides[get_feedback_service] = FakeService
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
    assert 'data: {"type":"done"}' in response.text
