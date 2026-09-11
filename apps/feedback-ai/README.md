# Feedback AI

`feedback-ai` 是 monorepo 内的独立、模块化 Python AI 服务。pnpm/Turborepo 负责统一命令编排，Python 版本和依赖由 uv 与 `pyproject.toml` 管理；前端应用不直接导入 Python 代码。

服务使用 LangChain 统一模型、Prompt、流式 Runnable、Embedding 和文本切片。目前注册了 `feedback`
（需求反馈）模块；后续业务模块通过同一注册入口接入，不需要把业务提示词、数据源或检索逻辑放回服务顶层。

需求从 MySQL 进入 pgvector，再由管理后台发起 RAG 问答的完整链路，参见
[`docs/feedback-to-ai-question-flow.md`](docs/feedback-to-ai-question-flow.md)。

```text
web-admin -> web-h5 (管理员鉴权、SSE 代理) -> feedback-ai (RAG/LLM)
                                                   |-> MySQL（反馈与 Outbox）
                                                   `-> PostgreSQL/pgvector（知识、会话与长期记忆）
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
- `GET /v1/modules`：列出已注册模块及其能力。
- `POST /v1/modules/feedback/chat`：需求反馈模块的 SSE 聊天流。
- `GET /v1/modules/feedback/conversations`：按用户列出历史对话。
- `GET/DELETE /v1/modules/feedback/conversations/{id}`：读取或删除历史对话。
- `POST /v1/modules/feedback/sync/process`：消费 MySQL `fb_aide_sync_job`。
- `POST /v1/modules/feedback/ingest`：全量重建反馈知识切片。
- `POST /v1/chat`、`POST /v1/sync/process`、`POST /v1/ingest`：兼容现有调用，转发到 `feedback` 模块。

除健康检查外，请求必须携带 `X-Feedback-AI-Token`。外部浏览器仍只访问 `web-h5` 的管理员 API，不直接访问 Python 服务。

## 模块结构

```text
src/feedback_ai/
  api.py                      # 通用模块路由和旧接口兼容层
  service.py                  # 模块注册、发现和分发
  conversation.py             # 跨模块复用的 PostgreSQL 历史会话仓储
  vector_store.py             # 共享 LangChain Document/Embedding 存储基础设施
  modules/
    base.py                   # 模块契约与能力声明
    feedback/
      module.py               # 需求反馈模块组合根和 LangChain 回答链
      config.py               # 模块配置
      mysql_source.py         # MySQL 事实来源和 Outbox
      repository.py           # 模块集合及精确 pgvector 查询
      retrieval.py            # 意图路由、上下文组装和 LangChain 切片
      sync.py                 # 全量/增量同步
      prompt.py               # ChatPromptTemplate
```

新增模块时，实现 `AssistantModule`、声明 `ModuleDescriptor`，把业务文件放进独立目录，并在
`feedback_ai.modules.create_modules()` 注册。模块只暴露自己支持的 `chat`、`ingest`、`sync` 能力；未注册模块返回
`404`，不支持的能力返回 `405`。

聊天会复用进程内的模型、Embedding 客户端和仓储实例；知识与长期记忆共享同一次问题 Embedding。精确筛选及引用
上一轮结果的短追问会跳过不必要的知识语义检索。模型历史限制为最近 8 条、合计 12,000 字，从而避免对话越长首字
等待越久。会话按 `module_id + user_id` 隔离，完整回答结束后才原子写入一问一答。

首次使用增量同步前，仍需执行：

```bash
pnpm --filter web-h5 db:migrate
```
