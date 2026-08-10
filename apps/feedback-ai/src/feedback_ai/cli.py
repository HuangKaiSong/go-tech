import argparse
import asyncio
from collections.abc import Sequence

import uvicorn

from feedback_ai.config import get_settings
from feedback_ai.schemas import ChatMessage
from feedback_ai.service import FeedbackService


async def ingest() -> None:
    result = await FeedbackService(get_settings()).ingest()
    print(f"知识库同步完成：{result['document_count']} 篇文档，{result['chunk_count']} 个切片")


async def sync(limit: int, watch: bool, interval: float) -> None:
    service = FeedbackService(get_settings())
    while True:
        result = await service.process_pending_sync_jobs(limit)
        if result["processed"]:
            print(f"增量同步完成：处理 {result['processed']}，成功 {result['succeeded']}，失败 {result['failed']}")
        if not watch:
            return
        await asyncio.sleep(interval)


async def chat(user_id: str) -> None:
    service = FeedbackService(get_settings())
    history: list[ChatMessage] = []
    print(f"Feedback AI 已启动（user={user_id}）。输入 /clear 清空短期记忆，/exit 退出。")
    while True:
        question = (await asyncio.to_thread(input, "\n你：")).strip()
        if not question:
            continue
        if question == "/exit":
            return
        if question == "/clear":
            history.clear()
            print("当前会话的短期记忆已清空。")
            continue

        print("Feedback AI：", end="", flush=True)
        answer = ""
        async for token in service.stream_answer(question, user_id, history):
            answer += token
            print(token, end="", flush=True)
        print()
        if answer:
            history.extend([ChatMessage(role="user", content=question), ChatMessage(role="assistant", content=answer)])
            history = history[-16:]


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="feedback-ai")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("ingest")

    sync_parser = subparsers.add_parser("sync")
    sync_parser.add_argument("--limit", type=int, default=10)
    sync_parser.add_argument("--watch", action="store_true")
    sync_parser.add_argument("--interval", type=float, default=5.0, help="Polling interval in seconds")

    chat_parser = subparsers.add_parser("chat")
    chat_parser.add_argument("--user", default="local-user")

    serve_parser = subparsers.add_parser("serve")
    serve_parser.add_argument("--host", default="0.0.0.0")
    serve_parser.add_argument("--port", type=int, default=8100)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_args(argv)
    if args.command == "serve":
        uvicorn.run("feedback_ai.main:app", host=args.host, port=args.port)
    elif args.command == "ingest":
        asyncio.run(ingest())
    elif args.command == "sync":
        asyncio.run(sync(args.limit, args.watch, args.interval))
    elif args.command == "chat":
        asyncio.run(chat(args.user))
