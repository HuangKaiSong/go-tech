# 从需求反馈到 AI 问答的完整链路

本文说明一条需求反馈如何从 `web-h5` 写入 MySQL，经 Outbox 增量同步到 PostgreSQL/pgvector，最终被
`web-admin` 中的 AI 问答检索，并以 SSE 流式返回给浏览器。

本文描述的是当前代码事实。涉及的主要应用如下：

| 组件                         | 职责                                                   | 生产运行方式                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `web-admin`                  | 需求反馈管理界面、AI 问答交互、SSE 消费                | Nginx 托管静态文件                            |
| `web-h5`                     | 需求反馈 API、管理员鉴权、Outbox 写入、Python 服务代理 | Next.js，PM2 进程 `go-tech-next`，端口 `3200` |
| `feedback-ai`                | MySQL 数据抽取、向量同步、RAG 检索、模型调用、SSE 生成 | FastAPI，PM2 进程 `feedback-ai`，端口 `8100`  |
| `feedback-ai-sync`           | 持续消费 MySQL Outbox                                  | PM2 常驻进程，默认每 5 秒轮询                 |
| MySQL                        | 需求、评论、点赞、分类以及同步任务的事实来源           | `MYSQL_DATABASE_URL`                          |
| PostgreSQL + pgvector        | 知识切片、Embedding、长期记忆                          | `POSTGRES_URL`                                |
| Embedding 服务               | 将需求文本和查询文本转换为向量                         | OpenAI-compatible API                         |
| DeepSeek-compatible Chat API | 根据检索上下文生成回答                                 | OpenAI-compatible Chat API                    |

## 1. 总体拓扑

```mermaid
flowchart LR
  Visitor["访客 / 客户"] --> H5UI["web-h5 需求反馈页面"]
  H5UI --> H5API["web-h5 反馈 Route Handler"]
  H5API --> MySQL[("MySQL\n需求事实 + Outbox")]

  H5API -. "响应后触发一次消费" .-> SyncAPI["feedback-ai /v1/sync/process\nfeedback 模块兼容入口"]
  Worker["feedback-ai-sync 常驻进程"] --> MySQL
  SyncAPI --> MySQL
  Worker --> VectorSync["文档构造 / 切片 / Embedding"]
  SyncAPI --> VectorSync
  VectorSync --> PG[("PostgreSQL + pgvector")]

  Admin["管理员浏览器"] --> Nginx["web-admin Nginx\n/h5-hook/"]
  Nginx --> NextChat["web-h5 管理员问答 API"]
  NextChat --> FastAPI["feedback-ai /v1/chat\nfeedback 模块兼容入口"]
  FastAPI --> PG
  FastAPI --> Embed["Embedding API"]
  FastAPI --> Chat["Chat API"]
  Chat -. "SSE token" .-> FastAPI
  FastAPI -. "SSE 透传" .-> NextChat
  NextChat -. "SSE 透传" .-> Nginx
  Nginx -. "SSE 透传" .-> Admin
```

这条链路分成两个相互独立但最终相接的阶段：

1. **知识写入链路**：需求反馈发生变化后，异步更新 pgvector。
2. **问答读取链路**：管理员提问时，从 pgvector 检索上下文，再调用模型生成答案。

MySQL 是业务事实来源，PostgreSQL/pgvector 是可重建的检索索引。问答不会在每次请求时直接扫描 MySQL。

## 2. 阶段一：需求反馈进入 MySQL

### 2.1 用户提交需求

用户在 `web-h5` 的需求反馈页面打开新需求弹窗。前端向下面的同源接口发送请求：

```http
POST /api/feedback/features
Content-Type: application/json

{
  "title": "...",
  "description": "...",
  "category": "...",
  "subCategory": "...",
  "turnstileToken": "..."
}
```

入口代码：

- [`NewPostDialog.tsx`](../../web-h5/app/components/feedback/NewPostDialog.tsx)
- [`features/route.ts`](../../web-h5/app/api/feedback/features/route.ts)

Route Handler 按顺序执行：

1. 确认反馈用户已经登录。
2. 校验标题、描述、分类和长度。
3. 校验 Turnstile 防机器人 Token。
4. 调用内容审核。
5. 校验分类与子分类是否存在。
6. 在一个 MySQL 事务中写入需求、初始点赞和同步任务。

事务中的三个关键写入是：

```text
fb_feature        <- 新需求，初始 like_count = 1
fb_vote           <- 提交者的初始点赞
fb_aide_sync_job  <- 同一个 feature_id 的向量同步任务
```

需求数据和 Outbox 任务位于同一个事务，因此不会出现“需求已提交，但因为进程在写任务前崩溃而永远不参与同步”的
中间状态。

### 2.2 哪些业务变化会重新入队

以下操作都会在修改业务数据的同一事务中调用 `enqueueFeedbackSync`：

| 业务变化       | 主要入口                                        | 为什么需要更新向量文档         |
| -------------- | ----------------------------------------------- | ------------------------------ |
| 新建需求       | `POST /api/feedback/features`                   | 标题、描述、分类成为新知识     |
| 点赞或取消点赞 | `POST /api/feedback/features/:id/vote`          | `like_count` 变化              |
| 新增用户评论   | `POST /api/feedback/features/:id/comments`      | `comment_count` 变化           |
| 官方回复       | `PUT /api/feedback/features/admin/:id/reply`    | 官方回复会写入知识文本         |
| 修改需求状态   | `PATCH /api/feedback/features/admin/:id/status` | 待评估、开发中、已完成状态变化 |
| 删除或恢复需求 | 管理员 delete/restore Route Handler             | 回收站状态和删除时间变化       |
| 删除或恢复评论 | 管理员 comment delete/restore Route Handler     | 回收站评论数量与内容变化       |

入队逻辑位于 [`sync.ts`](../../web-h5/app/api/feedback/sync.ts)，表结构位于
[`fb_aide_sync_jobs.ts`](../../web-h5/db/scheam/managed/fb_aide_sync_jobs.ts)。

## 3. Outbox 如何保证增量同步

### 3.1 一条需求只保留一条待处理任务

`fb_aide_sync_job` 以 `feature_id` 为主键。第一次变化插入任务；同一需求再次变化时不会插入重复行，而是：

- `revision = revision + 1`
- `attempts = 0`
- `available_at = CURRENT_TIMESTAMP`
- `last_error = NULL`

因此高频点赞、评论或状态更新会合并为“最终重新读取一次该需求”，而不是保存每次变化的事件内容。

### 3.2 两种消费触发方式

当前存在两个安全并行的消费者：

1. `web-h5` 在业务响应发送后通过 Next.js `after()` 调用 `POST /v1/sync/process`，最多连续处理 5 批，每批 10 条。该地址是 `feedback` 模块化接口的兼容入口。
2. PM2 进程 `feedback-ai-sync` 运行 `feedback-ai sync --watch --limit 10 --interval 5`，默认每 5 秒轮询一次。

第一种方式降低正常情况下的同步延迟；第二种方式保证即使响应后任务没有成功执行，Outbox 仍会被最终消费。

### 3.3 并发领取、版本变化与重试

Python 使用下面的约束领取任务：

```sql
SELECT ...
FROM fb_aide_sync_job
WHERE available_at <= CURRENT_TIMESTAMP
  AND (locked_at IS NULL OR locked_at < CURRENT_TIMESTAMP - 10 minutes)
FOR UPDATE SKIP LOCKED
```

关键语义：

- `FOR UPDATE SKIP LOCKED` 允许多个消费者并行运行而不重复领取同一行。
- `locked_at` 超过 10 分钟后视为失效锁，可被重新领取。
- 消费者完成旧 `revision` 时，只删除完全匹配的任务。
- 如果同步期间同一需求又发生变化，`revision` 已增加，旧消费者不会删除新任务，只会解除锁等待下一轮处理。
- 失败时记录截断后的 `last_error`，并按指数退避重新开放任务。
- 当前首次失败约等待 30 秒，随后逐步增加，最长等待 1 小时。

这保证的是**最终一致性**，不是 MySQL 与 PostgreSQL 之间的分布式事务强一致性。

## 4. 阶段二：MySQL 需求转成向量知识

增量消费主流程位于：

- [`mysql_source.py`](../src/feedback_ai/modules/feedback/mysql_source.py)
- [`sync.py`](../src/feedback_ai/modules/feedback/sync.py)
- [`retrieval.py`](../src/feedback_ai/modules/feedback/retrieval.py)
- [`vector_store.py`](../src/feedback_ai/vector_store.py)

### 4.1 从 MySQL 读取聚合文档

消费者按 `feature_id` 重新查询当前最终状态，而不是信任 Outbox 中的历史数据。查询聚合：

- 需求标题与描述
- 分类和子分类
- 状态、版本、上线时间
- 点赞数
- 当前可见评论数
- 当前可见的官方回复
- 已删除评论数量及内容
- 需求删除状态和删除时间

每条需求被格式化为可读文本，例如：

```text
標題：深色模式
分類：產品 > 移動端
狀態：待評估
點讚數：12
評論數：4
資料狀態：有效資料
回收站評論數：1
描述：希望支持深色模式
官方回覆：已列入評估
```

同时保留结构化 metadata：

```text
feature_id, category, sub_category, status, version,
like_count, comment_count, is_deleted, deleted_at,
deleted_comment_count, shipped_at
```

文本用于语义检索和模型上下文；metadata 用于点赞数、评论数、回收站等精确查询。

### 4.2 切片和 Embedding

聚合文档按照以下配置切片：

- `RAG_CHUNK_SIZE`：默认 800 个字符。
- `RAG_CHUNK_OVERLAP`：默认重叠 120 个字符。

每个切片增加：

- `chunk_index`
- `source = mysql_feature`
- 本次同步唯一的 `sync_version`

随后通过 `EMBEDDING_BASE_URL`、`EMBEDDING_API_KEY` 和 `EMBEDDING_MODEL` 调用 OpenAI-compatible
Embedding API。

### 4.3 写入 PostgreSQL/pgvector

`VectorStore.ensure_schema()` 确保存在：

```text
aide_collections  <- 集合名称与 UUID
aide_vectors      <- 文本、JSON metadata、向量、collection_id
```

知识切片写入 `aide_knowledge` 集合。长期记忆写入 `aide_long_term_memory` 集合，两者物理上共用表，
通过 `collection_id` 隔离。

增量更新采用“先写新版本，再删除该需求的其他 `sync_version`”策略：

1. 写入本次所有新切片。
2. 删除相同 `feature_id` 但 `sync_version` 不同的旧切片。
3. 成功后删除对应 Outbox 任务。

如果 MySQL 中已找不到该需求，则直接删除 PostgreSQL 中该 `feature_id` 的知识切片。

### 4.4 全量导入

首次部署或需要重建索引时运行：

```bash
pnpm --filter feedback-ai ingest
```

它会读取全部 MySQL 需求、重新切片，然后删除 `source = mysql_feature` 的旧知识并写入新知识。

全量导入期间删除和重新写入不是跨步骤原子事务，因此应尽量在低流量时执行；如果中途失败，可再次执行以重建。

## 5. 阶段三：管理员发起 AI 问答

### 5.1 `web-admin` 生成请求

入口组件是 [`FeedbackAssistant.tsx`](../../web-admin/src/pages/FeedbackPage/FeedbackAssistant.tsx)。管理员发送问题时：

1. 取最近 16 条消息作为短期对话历史。
2. 插入一个空的 assistant 消息作为流式输出占位。
3. 使用 `AbortController` 支持停止生成或关闭弹窗时取消请求。
4. 调用 [`assistant-api.ts`](../../web-admin/src/pages/FeedbackPage/assistant-api.ts)。

浏览器请求为：

```http
POST /h5-hook/api/feedback/features/admin/assistant/chat
Authorization: Bearer <管理员 JWT>
Content-Type: application/json

{
  "question": "找出點讚大於 50 的需求",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

`Authorization` 并不是 `assistant-api.ts` 直接写入的；管理后台布局
[`AdminLayout.tsx`](../../web-admin/src/components/layout/AdminLayout.tsx) 包装了 `window.fetch`，统一添加管理员 JWT。

### 5.2 Nginx 将静态站请求转给 Next.js

生产环境的 `web-admin` 是静态站点，Vite 开发服务器中的 proxy 配置不会随构建产物运行。因此生产 Nginx
必须提供 `/h5-hook/` 代理：

```nginx
location ^~ /h5-hook/ {
    proxy_pass http://127.0.0.1:3200/;

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";

    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}
```

`location` 和 `proxy_pass` 末尾的 `/` 都有意义。它会将：

```text
/h5-hook/api/feedback/features/admin/assistant/chat
```

转换为：

```text
http://127.0.0.1:3200/api/feedback/features/admin/assistant/chat
```

关闭 `proxy_buffering` 可以避免 Nginx 聚合多个 SSE token 后才一次性发送。

### 5.3 `web-h5` 完成管理员鉴权与内部代理

Next.js Route Handler 位于
[`assistant/chat/route.ts`](../../web-h5/app/api/feedback/features/admin/assistant/chat/route.ts)。它依次执行：

1. 从 `Authorization: Bearer ...` 读取管理员 JWT。
2. 使用 `PLATFORM_JWT_SECRET` 和 `HS512` 验签。
3. 根据 `userId`，必要时根据 `username`，确认 MySQL 中存在启用状态的管理员。
4. 使用 Zod 校验问题和历史；问题最多 4,000 字，历史最多 16 条，每条最多 12,000 字。
5. 将用户标识改写为 `admin:<管理员 ID>`，避免浏览器自行伪造长期记忆所属用户。
6. 通过 [`ai-client.ts`](../../web-h5/app/api/feedback/ai-client.ts) 调用
   `FEEDBACK_AI_URL/v1/chat`。该旧地址由通用模块路由兼容转发到 `feedback`；新调用也可直接使用
   `/v1/modules/feedback/chat`。
7. 增加内部请求头 `X-Feedback-AI-Token`，其值来自 `FEEDBACK_AI_INTERNAL_TOKEN`。
8. 不读取和重组正常响应内容，直接将 Python 的 SSE body 透传给浏览器。

`FEEDBACK_AI_INTERNAL_TOKEN` 只用于 `web-h5 -> feedback-ai` 的服务间认证，不应暴露为 `NEXT_PUBLIC_*`
或 `VITE_*` 环境变量。

### 5.4 FastAPI 接收请求

FastAPI 的入口是 [`main.py`](../src/feedback_ai/main.py)，聊天接口为：

```http
POST /v1/chat
X-Feedback-AI-Token: <内部 Token>
Content-Type: application/json
```

依赖 [`dependencies.py`](../src/feedback_ai/dependencies.py) 使用常量时间比较验证内部 Token。未配置返回
`503`，缺失或不匹配返回 `401`。

请求模型由 [`schemas.py`](../src/feedback_ai/schemas.py) 再次校验。验证成功后，API 立即建立
`text/event-stream` 响应，实际检索和模型调用发生在流生成器内。

服务可通过 `GET /v1/modules` 发现模块及其能力。模块化正式入口为
`/v1/modules/{module_id}/chat`、`/v1/modules/{module_id}/ingest` 和
`/v1/modules/{module_id}/sync/process`；当前三个旧 POST 地址保留为
`feedback` 的兼容入口，因而 `web-h5` 无需同步发布即可继续工作。

## 6. RAG 如何构造回答上下文

通用模块分发位于 [`service.py`](../src/feedback_ai/service.py)，需求反馈编排位于
[`module.py`](../src/feedback_ai/modules/feedback/module.py)，检索路由位于
[`retrieval.py`](../src/feedback_ai/modules/feedback/retrieval.py)。每次提问执行：

1. 确保 pgvector 扩展和存储表存在。
2. 对问题做意图识别。
3. 并行执行适用的检索任务。
4. 将结果组织成 `<retrieved-context>`。
5. 由 LangChain `ChatPromptTemplate` 拼接系统提示、最近 16 条短期历史和当前问题。
6. 通过 LangChain DeepSeek ChatModel 和 Runnable 流调用模型，设置 `temperature = 0`。
7. 将模型增量内容逐块转换为 SSE token。

### 6.1 检索分支

| 问题类型           | 检索方式                                    | 数据范围                                  |
| ------------------ | ------------------------------------------- | ----------------------------------------- |
| 普通语义问题       | 问题 Embedding + pgvector 相似度            | `aide_knowledge`，仅 `is_deleted = false` |
| “点赞大于/至少 N”  | metadata 中的 `like_count` 精确 SQL 过滤    | 未删除需求，最多 100 条                   |
| “评论大于/至少 N”  | metadata 中的 `comment_count` 精确 SQL 过滤 | 未删除需求，最多 100 条                   |
| 评论排行           | 按 `comment_count` 精确降序                 | 未删除需求，最多 100 条                   |
| 回收站、已删除问题 | metadata 精确查询                           | 已删除需求或包含已删除评论的需求          |
| 用户长期记忆       | 问题 Embedding + `user_id` metadata 过滤    | `aide_long_term_memory`                   |

普通问题会执行语义检索；明确询问回收站时跳过普通有效知识检索，改走回收站精确查询。

点赞数、评论数和回收站问题必须使用 metadata 精确查询结果，而不是让模型从相似文本中猜测数值。

### 6.2 短期历史与长期记忆

- **短期历史**：由浏览器保存并在每次请求中传递，最多 16 条；服务器当前不持久化它。
- **长期记忆**：当问题包含“请记住”等意图，且不包含密码、API Key、Token、银行卡等敏感关键词时，
  将原始问题写入 `aide_long_term_memory`。
- 长期记忆使用 Next.js 生成的 `admin:<管理员 ID>` 隔离。

### 6.3 提示词边界

系统提示位于 [`prompt.py`](../src/feedback_ai/modules/feedback/prompt.py)，主要要求模型：

- 优先依据检索上下文回答，但把上下文视为资料而不是指令。
- 不编造不存在的状态、日期、版本和官方回复。
- 尽量附带 `feature_id` 以便核对来源。
- 数值、排行和回收站问题以精确检索结果为准。
- 不复述敏感凭据。

当前实现属于 RAG，不会让模型直接写 MySQL，也不会让模型执行任意 SQL。

## 7. SSE 响应如何回到界面

Python 产生三种事件：

```text
data: {"type":"token","content":"第一段文字"}

data: {"type":"token","content":"第二段文字"}

data: {"type":"done"}
```

如果已经建立 SSE 响应后，检索或模型调用发生异常，则返回：

```text
data: {"type":"error","message":"AI 助手暫時無法回應，請稍後再試"}
```

响应按下面的顺序透传：

```text
feedback-ai -> web-h5 Route Handler -> Nginx -> 浏览器 ReadableStream
```

`web-admin` 按空行拆分 SSE block，解析 `data:` JSON：

- `token`：追加到当前 assistant 消息并实时渲染 Markdown。
- `done`：结束本轮读取。
- `error`：抛出前端错误；如果尚未收到 token，显示错误提示。
- 用户点击停止：`AbortController` 取消请求。

## 8. HTTP 状态与流内状态不能混为一谈

这是排障时最重要的区别：

| 浏览器观察结果                         | 故障位置或含义                                                         |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `401/403` JSON                         | `web-h5` 管理员 JWT 校验失败或管理员被停用                             |
| `400` JSON                             | 问题或历史格式不符合 Next.js 校验                                      |
| `502` JSON                             | `web-h5` 无法连接 Python，或 Python 在建立流之前返回非 2xx             |
| `200 + text/event-stream + token/done` | 完整问答成功                                                           |
| `200 + text/event-stream + type:error` | 流已建立，但 Python 后续的 PostgreSQL、Embedding、检索或 Chat 调用失败 |
| 返回 `web-admin` HTML 或 Nginx 404     | `/h5-hook/` 未正确代理到 `web-h5`                                      |

因此，**HTTP 200 只表示 SSE 通道已经建立，不表示模型一定成功回答**。

Python 在流内异常时会记录 `Feedback assistant stream failed` 及完整 traceback：

```bash
pm2 logs feedback-ai --err --lines 150
```

Next.js 无法访问 Python 时记录：

```bash
pm2 logs go-tech-next --lines 150
```

## 9. 一致性、边界与当前限制

### 9.1 数据新鲜度

正常情况下，`after()` 会在业务响应后立即触发同步；即使该触发失败，常驻 worker 默认最多约 5 秒后发现任务。
外部 API、数据库错误或重试退避会延长可见延迟。

### 9.2 跨数据库是最终一致性

MySQL 业务变更和 Outbox 写入是同一事务，但 MySQL 与 PostgreSQL 之间没有分布式事务。短时间内问答可能读到上一版本
的向量数据。Outbox、revision 和重试负责最终收敛。

### 9.3 增量同步存在很短的版本交叠窗口

增量同步先写新切片再删除旧切片，这避免先删后写失败导致知识完全消失，但在两个数据库事务之间可能暂时同时看到
新旧切片。

### 9.4 健康检查只检查进程存活

`GET /health` 返回 FastAPI 进程状态，不检查 MySQL、PostgreSQL、Embedding 或 Chat API。因此 `/health` 正常不代表
完整问答链路正常。

### 9.5 模型配置必须与供应商匹配

`EMBEDDING_MODEL` 必须由 `EMBEDDING_BASE_URL` 对应的服务支持；Chat 模型也必须由
`DEEPSEEK_BASE_URL` 对应服务支持。CLI 聊天可用于直接验证 Python 的完整依赖链。

## 10. 生产部署关系

当前 PM2 配置见 [`ecosystem.config.cjs`](../../../ecosystem.config.cjs)：

```text
go-tech-next       -> pnpm run start:h5，监听 3200
feedback-ai        -> uvicorn，监听 127.0.0.1:8100，2 workers
feedback-ai-sync   -> feedback-ai sync --watch --limit 10 --interval 5
```

### 10.1 `web-h5` 必需配置

```dotenv
PLATFORM_JWT_SECRET=...
FEEDBACK_AI_URL=http://127.0.0.1:8100
FEEDBACK_AI_INTERNAL_TOKEN=...
```

### 10.2 `feedback-ai` 必需配置

```dotenv
FEEDBACK_AI_INTERNAL_TOKEN=... # 必须与 web-h5 相同
MYSQL_DATABASE_URL=mysql://...
POSTGRES_URL=postgresql://...
EMBEDDING_API_KEY=...
EMBEDDING_BASE_URL=...
EMBEDDING_MODEL=...
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=...
DEEPSEEK_MODEL=...
```

不得将真实密钥提交到仓库。

## 11. 发布与验证清单

### 11.1 修改 `web-h5` 后

Next.js 生产模式运行 `.next` 构建产物。修改 Route Handler 或 server-only 代理代码后，仅执行 `pm2 restart` 不会更新
构建产物，必须重新构建：

```bash
cd /www/wwwroot/go-tech-frontend
pnpm build:h5
pm2 restart go-tech-next --update-env
```

如果浏览器仍返回旧行为，优先检查是否忘记执行 `pnpm build:h5`。

### 11.2 修改 Python 后

生产环境使用 `.venv/site-packages` 中的非 editable 安装。仅执行 `git pull` 不会更新已安装包：

```bash
cd /www/wwwroot/go-tech-frontend/apps/feedback-ai
uv sync --locked --no-dev --no-editable --reinstall-package go-tech-feedback-ai

cd /www/wwwroot/go-tech-frontend
pm2 restart feedback-ai feedback-ai-sync --update-env
```

### 11.3 分层验证

依次验证可以快速确定故障层：

```bash
# 1. FastAPI 进程
curl -i http://127.0.0.1:8100/health

# 2. Python 完整 RAG/模型链路，不经过 HTTP 和 Next.js
cd /www/wwwroot/go-tech-frontend/apps/feedback-ai
.venv/bin/feedback-ai chat --user diagnose

# 3. Next.js 路由存在；GET 返回 405 属于预期
curl -i http://127.0.0.1:3200/api/feedback/features/admin/assistant/chat

# 4. Nginx 是否正确去掉 /h5-hook 前缀；GET 返回 405 属于预期
curl -i https://<管理端域名>/h5-hook/api/feedback/features/admin/assistant/chat
```

### 11.4 查看 Outbox 状态

```sql
SELECT feature_id, revision, attempts, available_at, locked_at, last_error, updated_at
FROM fb_aide_sync_job
ORDER BY updated_at DESC
LIMIT 20;
```

判断方式：

- 表为空：当前没有待同步任务。
- `attempts` 持续增加：查看 `last_error` 和 `feedback-ai-sync` 错误日志。
- `locked_at` 长时间不释放：确认 worker 是否存活；超过 10 分钟后任务可自动重新领取。
- 需求刚变化但问答仍是旧数据：先确认任务是否仍在 Outbox，再检查 PostgreSQL 和 Embedding 调用。

## 12. 关键代码索引

| 环节                    | 文件                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| 需求提交 UI             | [`NewPostDialog.tsx`](../../web-h5/app/components/feedback/NewPostDialog.tsx)                     |
| 需求写入 API            | [`features/route.ts`](../../web-h5/app/api/feedback/features/route.ts)                            |
| Outbox 写入和响应后消费 | [`sync.ts`](../../web-h5/app/api/feedback/sync.ts)                                                |
| Outbox 表结构           | [`fb_aide_sync_jobs.ts`](../../web-h5/db/scheam/managed/fb_aide_sync_jobs.ts)                     |
| 管理端 AI 交互          | [`FeedbackAssistant.tsx`](../../web-admin/src/pages/FeedbackPage/FeedbackAssistant.tsx)           |
| 浏览器 SSE 客户端       | [`assistant-api.ts`](../../web-admin/src/pages/FeedbackPage/assistant-api.ts)                     |
| 管理员 JWT 自动注入     | [`AdminLayout.tsx`](../../web-admin/src/components/layout/AdminLayout.tsx)                        |
| Next.js 管理员鉴权      | [`auth.ts`](../../web-h5/app/api/feedback/features/admin/auth.ts)                                 |
| Next.js AI 服务客户端   | [`ai-client.ts`](../../web-h5/app/api/feedback/ai-client.ts)                                      |
| Next.js 聊天代理        | [`assistant/chat/route.ts`](../../web-h5/app/api/feedback/features/admin/assistant/chat/route.ts) |
| FastAPI 路由和 SSE      | [`api.py`](../src/feedback_ai/api.py)                                                             |
| 内部 Token 验证         | [`dependencies.py`](../src/feedback_ai/dependencies.py)                                           |
| 模块注册与分发          | [`service.py`](../src/feedback_ai/service.py)                                                     |
| 需求反馈模块组合根      | [`module.py`](../src/feedback_ai/modules/feedback/module.py)                                      |
| MySQL 聚合和任务领取    | [`mysql_source.py`](../src/feedback_ai/modules/feedback/mysql_source.py)                          |
| 增量及全量同步          | [`sync.py`](../src/feedback_ai/modules/feedback/sync.py)                                          |
| 文本切片与检索编排      | [`retrieval.py`](../src/feedback_ai/modules/feedback/retrieval.py)                                |
| pgvector 精确查询       | [`repository.py`](../src/feedback_ai/modules/feedback/repository.py)                              |
| 共享 LangChain 向量存储 | [`vector_store.py`](../src/feedback_ai/vector_store.py)                                           |
| 系统提示                | [`prompt.py`](../src/feedback_ai/modules/feedback/prompt.py)                                      |
| PM2 进程定义            | [`ecosystem.config.cjs`](../../../ecosystem.config.cjs)                                           |
