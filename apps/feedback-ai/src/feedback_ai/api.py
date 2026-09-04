import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from feedback_ai.dependencies import AssistantServiceDep, InternalAuthDep
from feedback_ai.modules.base import UnsupportedModuleCapabilityError
from feedback_ai.schemas import ChatRequest, IngestResult, ModuleInfo, SyncRequest, SyncResult
from feedback_ai.service import DEFAULT_MODULE_ID, AssistantService, UnknownModuleError

logger = logging.getLogger(__name__)
router = APIRouter()


def encode_sse(event: dict[str, object]) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False, separators=(',', ':'))}\n\n"


def module_http_error(error: UnknownModuleError | UnsupportedModuleCapabilityError) -> HTTPException:
    if isinstance(error, UnknownModuleError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, detail=str(error))


def chat_response(module_id: str, payload: ChatRequest, service: AssistantService) -> StreamingResponse:
    try:
        stream = service.stream_answer(module_id, payload.question, payload.user_id, payload.history)
    except (UnknownModuleError, UnsupportedModuleCapabilityError) as error:
        raise module_http_error(error) from error

    async def events() -> AsyncIterator[str]:
        try:
            async for token in stream:
                yield encode_sse({"type": "token", "content": token})
            yield encode_sse({"type": "done"})
        except Exception:
            logger.exception("Assistant module %s stream failed", module_id)
            yield encode_sse({"type": "error", "message": "AI 助手暫時無法回應，請稍後再試"})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


@router.get("/modules", response_model=list[ModuleInfo])
async def list_modules(service: AssistantServiceDep, _auth: InternalAuthDep) -> list[ModuleInfo]:
    return [
        ModuleInfo(id=item.id, name=item.name, capabilities=sorted(item.capabilities))
        for item in service.list_modules()
    ]


@router.post("/modules/{module_id}/chat")
async def module_chat(
    module_id: str,
    payload: ChatRequest,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> StreamingResponse:
    return chat_response(module_id, payload, service)


@router.post("/chat", deprecated=True)
async def chat(payload: ChatRequest, service: AssistantServiceDep, _auth: InternalAuthDep) -> StreamingResponse:
    return chat_response(DEFAULT_MODULE_ID, payload, service)


async def process_module_sync(module_id: str, limit: int, service: AssistantService) -> SyncResult:
    try:
        result = await service.process_pending_sync_jobs(module_id, limit)
    except (UnknownModuleError, UnsupportedModuleCapabilityError) as error:
        raise module_http_error(error) from error
    return SyncResult.model_validate(result)


async def ingest_module(module_id: str, service: AssistantService) -> IngestResult:
    try:
        result = await service.ingest(module_id)
    except (UnknownModuleError, UnsupportedModuleCapabilityError) as error:
        raise module_http_error(error) from error
    return IngestResult.model_validate(result)


@router.post("/modules/{module_id}/sync/process", response_model=SyncResult)
async def module_process_sync(
    module_id: str,
    payload: SyncRequest,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> SyncResult:
    return await process_module_sync(module_id, payload.limit, service)


@router.post("/modules/{module_id}/ingest", response_model=IngestResult)
async def module_ingest(
    module_id: str,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> IngestResult:
    return await ingest_module(module_id, service)


@router.post("/sync/process", response_model=SyncResult)
async def process_sync(
    payload: SyncRequest,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> SyncResult:
    return await process_module_sync(DEFAULT_MODULE_ID, payload.limit, service)


@router.post("/ingest", response_model=IngestResult)
async def ingest(service: AssistantServiceDep, _auth: InternalAuthDep) -> IngestResult:
    return await ingest_module(DEFAULT_MODULE_ID, service)
