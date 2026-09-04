from fastapi import FastAPI

from feedback_ai.api import router
from feedback_ai.config import get_settings


def create_app() -> FastAPI:
    """创建 FastAPI 应用并挂载健康检查和模块化 API。"""

    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    @app.get("/health")
    async def health() -> dict[str, str]:
        """仅报告进程存活，不探测外部数据库或模型服务。"""

        return {"service": "feedback-ai", "status": "ok"}

    app.include_router(router, prefix="/v1", tags=["assistant-modules"])
    return app


app = create_app()
