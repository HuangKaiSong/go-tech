import json
import logging
from collections.abc import AsyncIterator
from time import perf_counter
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from feedback_ai.conversation import Conversation, ConversationNotFoundError
from feedback_ai.conversation import ConversationDetail as StoredConversationDetail
from feedback_ai.dependencies import AssistantServiceDep, InternalAuthDep
from feedback_ai.modules.base import UnsupportedModuleCapabilityError
from feedback_ai.schemas import (
    ChatRequest,
    ConversationDeleteResult,
    ConversationDetail,
    ConversationSummary,
    IngestResult,
    ModuleInfo,
    SyncRequest,
    SyncResult,
)
from feedback_ai.service import DEFAULT_MODULE_ID, AssistantService, UnknownModuleError

logger = logging.getLogger(__name__)
timing_logger = logging.getLogger("uvicorn.error")
router = APIRouter()


def encode_sse(event: dict[str, object]) -> str:
    """将事件编码为浏览器可逐块解析的 SSE data 帧。"""

    return f"data: {json.dumps(event, ensure_ascii=False, separators=(',', ':'))}\n\n"


def module_http_error(
    error: UnknownModuleError | UnsupportedModuleCapabilityError | ConversationNotFoundError,
) -> HTTPException:
    """把模块域错误转换为稳定的 HTTP 状态码。"""

    if isinstance(error, (UnknownModuleError, ConversationNotFoundError)):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, detail=str(error))


def conversation_summary(item: Conversation) -> ConversationSummary:
    """把会话领域对象映射为公开响应，避免暴露内部 user_id。"""

    return ConversationSummary(
        id=item.id,
        title=item.title,
        created_at=item.created_at,
        updated_at=item.updated_at,
        message_count=item.message_count,
    )


def conversation_detail(item: StoredConversationDetail) -> ConversationDetail:
    """把会话详情映射为公开响应模型。"""

    return ConversationDetail(**conversation_summary(item.conversation).model_dump(), messages=item.messages)


async def chat_response(module_id: str, payload: ChatRequest, service: AssistantService) -> StreamingResponse:
    """在建立 SSE 前完成模块校验，再将回答流包装为统一事件协议。"""

    request_started = perf_counter()
    try:
        prepared = await service.prepare_chat(
            module_id,
            payload.question,
            payload.user_id,
            payload.conversation_id,
            payload.history,
        )
        stream = service.stream_answer(module_id, payload.question, payload.user_id, prepared.history)
    except (UnknownModuleError, UnsupportedModuleCapabilityError, ConversationNotFoundError) as error:
        raise module_http_error(error) from error
    prepare_ms = (perf_counter() - request_started) * 1000

    async def events() -> AsyncIterator[str]:
        # 会话元数据不依赖模型，可立即送达，让前端先建立历史记录并缩短感知等待。
        yield encode_sse(
            {
                "type": "conversation",
                "conversation_id": str(prepared.conversation.id),
                "title": prepared.conversation.title,
            }
        )
        answer_parts: list[str] = []
        first_token_recorded = False
        # HTTP 响应一旦开始发送便不能再修改状态码，后续异常必须作为流内 error 事件返回。
        try:
            async for token in stream:
                if not first_token_recorded:
                    first_token_recorded = True
                    timing_logger.info(
                        "Assistant timing module=%s conversation=%s prepare_ms=%.1f first_token_ms=%.1f "
                        "history_messages=%d history_characters=%d",
                        module_id,
                        prepared.conversation.id,
                        prepare_ms,
                        (perf_counter() - request_started) * 1000,
                        len(prepared.history),
                        sum(len(message.content) for message in prepared.history),
                    )
                answer_parts.append(token)
                yield encode_sse({"type": "token", "content": token})
            answer = "".join(answer_parts).strip()
            if answer:
                await service.save_exchange(
                    module_id,
                    payload.user_id,
                    prepared.conversation.id,
                    payload.question,
                    answer,
                )
            yield encode_sse({"type": "done", "conversation_id": str(prepared.conversation.id)})
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
    """列出当前已启用的模块和能力。"""

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
    """调用指定模块的聊天能力。"""

    return await chat_response(module_id, payload, service)


@router.post("/chat", deprecated=True)
async def chat(payload: ChatRequest, service: AssistantServiceDep, _auth: InternalAuthDep) -> StreamingResponse:
    """兼容旧调用，将聊天请求转发到默认的需求反馈模块。"""

    return await chat_response(DEFAULT_MODULE_ID, payload, service)


@router.get("/modules/{module_id}/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    module_id: str,
    user_id: str,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
    limit: int = 50,
) -> list[ConversationSummary]:
    """列出指定用户在模块内的历史对话。"""

    try:
        items = await service.list_conversations(module_id, user_id, limit)
    except (UnknownModuleError, UnsupportedModuleCapabilityError) as error:
        raise module_http_error(error) from error
    return [conversation_summary(item) for item in items]


@router.get("/modules/{module_id}/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    module_id: str,
    conversation_id: UUID,
    user_id: str,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> ConversationDetail:
    """读取历史对话和全部消息。"""

    try:
        item = await service.conversation_detail(module_id, user_id, conversation_id)
    except (UnknownModuleError, UnsupportedModuleCapabilityError, ConversationNotFoundError) as error:
        raise module_http_error(error) from error
    return conversation_detail(item)


@router.delete(
    "/modules/{module_id}/conversations/{conversation_id}",
    response_model=ConversationDeleteResult,
)
async def delete_conversation(
    module_id: str,
    conversation_id: UUID,
    user_id: str,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> ConversationDeleteResult:
    """删除当前用户拥有的历史对话。"""

    try:
        await service.delete_conversation(module_id, user_id, conversation_id)
    except (UnknownModuleError, UnsupportedModuleCapabilityError, ConversationNotFoundError) as error:
        raise module_http_error(error) from error
    return ConversationDeleteResult(deleted=True, id=conversation_id)


async def process_module_sync(module_id: str, limit: int, service: AssistantService) -> SyncResult:
    """执行模块同步并统一转换响应模型和域错误。"""

    try:
        result = await service.process_pending_sync_jobs(module_id, limit)
    except (UnknownModuleError, UnsupportedModuleCapabilityError) as error:
        raise module_http_error(error) from error
    return SyncResult.model_validate(result)


async def ingest_module(module_id: str, service: AssistantService) -> IngestResult:
    """执行模块全量导入并统一转换响应模型和域错误。"""

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
    """消费指定模块的增量同步任务。"""

    return await process_module_sync(module_id, payload.limit, service)


@router.post("/modules/{module_id}/ingest", response_model=IngestResult)
async def module_ingest(
    module_id: str,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> IngestResult:
    """重建指定模块的知识索引。"""

    return await ingest_module(module_id, service)


@router.post("/sync/process", response_model=SyncResult)
async def process_sync(
    payload: SyncRequest,
    service: AssistantServiceDep,
    _auth: InternalAuthDep,
) -> SyncResult:
    """兼容旧调用，将同步请求转发到默认的需求反馈模块。"""

    return await process_module_sync(DEFAULT_MODULE_ID, payload.limit, service)


@router.post("/ingest", response_model=IngestResult)
async def ingest(service: AssistantServiceDep, _auth: InternalAuthDep) -> IngestResult:
    """兼容旧调用，将全量导入转发到默认的需求反馈模块。"""

    return await ingest_module(DEFAULT_MODULE_ID, service)
