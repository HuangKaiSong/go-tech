from fastapi import FastAPI

from feedback_ai.api import router
from feedback_ai.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"service": "feedback-ai", "status": "ok"}

    app.include_router(router, prefix="/v1", tags=["feedback-ai"])
    return app


app = create_app()
