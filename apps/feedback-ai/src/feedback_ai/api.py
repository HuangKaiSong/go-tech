import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from feedback_ai.dependencies import FeedbackServiceDep, InternalAuthDep
from feedback_ai.schemas import ChatRequest, IngestResult, SyncRequest, SyncResult

logger = logging.getLogger(__name__)
router = APIRouter()


def encode_sse(event: dict[str, object]) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False, separators=(',', ':'))}\n\n"


@router.post("/chat", dependencies=[])
async def chat(
    payload: ChatRequest,
    service: FeedbackServiceDep,
    _auth: InternalAuthDep,
) -> StreamingResponse:
    async def events() -> AsyncIterator[str]:
        try:
            async for token in service.stream_answer(payload.question, payload.user_id, payload.history):
                yield encode_sse({"type": "token", "content": token})
            yield encode_sse({"type": "done"})
        except Exception:
            logger.exception("Feedback assistant stream failed")
            yield encode_sse({"type": "error", "message": "AI 助手暫時無法回應，請稍後再試"})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


@router.post("/sync/process", response_model=SyncResult)
async def process_sync(
    payload: SyncRequest,
    service: FeedbackServiceDep,
    _auth: InternalAuthDep,
) -> SyncResult:
    return SyncResult.model_validate(await service.process_pending_sync_jobs(payload.limit))


@router.post("/ingest", response_model=IngestResult)
async def ingest(service: FeedbackServiceDep, _auth: InternalAuthDep) -> IngestResult:
    return IngestResult.model_validate(await service.ingest())
