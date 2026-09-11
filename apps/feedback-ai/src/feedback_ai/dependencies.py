import secrets
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from feedback_ai.config import Settings, get_settings
from feedback_ai.conversation import ConversationRepository
from feedback_ai.service import AssistantService

SettingsDep = Annotated[Settings, Depends(get_settings)]


def require_internal_token(
    settings: SettingsDep,
    token: Annotated[str | None, Header(alias="X-Feedback-AI-Token")] = None,
) -> None:
    """使用常量时间比较校验来自 web-h5 的内部服务令牌。"""

    expected = settings.feedback_ai_internal_token.get_secret_value()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FEEDBACK_AI_INTERNAL_TOKEN is not configured",
        )
    if token is None or not secrets.compare_digest(token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal token")


@lru_cache
def get_assistant_service() -> AssistantService:
    """复用模块、模型客户端和会话仓储，减少每次聊天的首字等待。"""

    settings = get_settings()
    return AssistantService(conversation_repository=ConversationRepository(settings.require_postgres_url()))


AssistantServiceDep = Annotated[AssistantService, Depends(get_assistant_service)]
InternalAuthDep = Annotated[None, Depends(require_internal_token)]
