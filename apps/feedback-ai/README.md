# Feedback AI

`feedback-ai` 是 monorepo 内的独立 Python 服务。pnpm/Turborepo 负责统一命令编排，Python 版本和依赖由 uv 与 `pyproject.toml` 管理；前端应用不直接导入 Python 代码。

```text
web-admin -> web-h5 (管理员鉴权、SSE 代理) -> feedback-ai (RAG/LLM)
                                                   |-> MySQL（反馈与 Outbox）
                                                   `-> PostgreSQL/pgvector（知识与长期记忆）
```

## 环境准备

需要：

- Node.js 20+、pnpm 10
- uv
- Python 3.11+（uv 会按 `pyproject.toml` 自动准备）
- PostgreSQL + pgvector

复制 `apps/feedback-ai/.env.example` 为 `apps/feedback-ai/.env`。同时在 `apps/web-h5/.env.local` 配置：

```dotenv
FEEDBACK_AI_URL=http://127.0.0.1:8100
FEEDBACK_AI_INTERNAL_TOKEN=与-feedback-ai-相同的长随机值
```

`FEEDBACK_AI_INTERNAL_TOKEN` 仅用于 `web-h5` 与 Python 服务之间的内部认证，不得使用 `NEXT_PUBLIC_*` 或 `VITE_*` 前缀。

DeepSeek 目前只用于聊天；嵌入模型通过独立的 OpenAI-compatible embeddings 地址配置。

## 常用命令

从仓库根目录运行：

```bash
pnpm --filter feedback-ai install:python
pnpm --filter feedback-ai dev
pnpm --filter feedback-ai test
pnpm --filter feedback-ai type-check
pnpm --filter feedback-ai lint
```

全量导入知识库：

```bash
pnpm --filter feedback-ai ingest
```

增量同步 Outbox：

```bash
pnpm --filter feedback-ai sync
pnpm --filter feedback-ai sync:watch
```

本地命令行聊天：

```bash
pnpm --filter feedback-ai chat -- --user user-001
```

## HTTP 契约

- `GET /health`：健康检查，无需内部 token。
- `POST /v1/chat`：SSE 聊天流。
- `POST /v1/sync/process`：消费 MySQL `fb_aide_sync_job`。
- `POST /v1/ingest`：全量重建反馈知识切片。

除健康检查外，请求必须携带 `X-Feedback-AI-Token`。外部浏览器仍只访问 `web-h5` 的管理员 API，不直接访问 Python 服务。

首次使用增量同步前，仍需执行：

```bash
pnpm --filter web-h5 db:migrate
```
