import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from feedback_ai.config import Settings, get_settings
from feedback_ai.service import FeedbackService

SettingsDep = Annotated[Settings, Depends(get_settings)]


def require_internal_token(
    settings: SettingsDep,
    token: Annotated[str | None, Header(alias="X-Feedback-AI-Token")] = None,
) -> None:
    expected = settings.feedback_ai_internal_token.get_secret_value()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FEEDBACK_AI_INTERNAL_TOKEN is not configured",
        )
    if token is None or not secrets.compare_digest(token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal token")


def get_feedback_service(settings: SettingsDep) -> FeedbackService:
    return FeedbackService(settings)


FeedbackServiceDep = Annotated[FeedbackService, Depends(get_feedback_service)]
InternalAuthDep = Annotated[None, Depends(require_internal_token)]
