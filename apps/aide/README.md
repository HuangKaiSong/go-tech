# Aide

Aide 从 MySQL 读取产品反馈文档，切片后写入本地 PostgreSQL/pgvector，并使用 DeepSeek 完成带短期记忆、长期记忆和检索上下文的流式问答。

## 准备 PostgreSQL

本地 PostgreSQL 必须安装 `pgvector` 扩展。程序启动时会执行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

因此连接用户需要有创建扩展的权限；也可以先用管理员账号手动执行上面的 SQL，再使用普通账号连接。

程序会自动创建以下表：

- `aide_vectors`：知识切片和长期记忆的向量数据
- `aide_collections`：隔离知识库与长期记忆的 collection

## 环境变量

复制 `.env.example` 为 `.env`，填写：

- `DEEPSEEK_API_KEY`：DeepSeek 对话 API Key
- `MYSQL_DATABASE_URL`：来源 MySQL 连接地址；兼容原来的 `DATABASE_URL`
- `POSTGRES_URL`：本地 PostgreSQL 连接地址
- `EMBEDDING_API_KEY`：嵌入服务 API Key
- `EMBEDDING_BASE_URL`：OpenAI 兼容的嵌入服务地址
- `EMBEDDING_MODEL`：嵌入模型名称

DeepSeek 的聊天接口不提供 embeddings，所以对话模型与嵌入模型必须分别配置。嵌入服务可以是 OpenAI，也可以是其他支持 OpenAI embeddings API 的服务。

## 导入知识库

```bash
pnpm --filter aide ingest
```

每次执行都会删除 `aide_knowledge` collection 中来源为 `mysql_feature` 的旧切片，然后写入本次从 MySQL 读取的新切片；长期记忆不会被删除。

## 启动聊天

```bash
pnpm --filter aide chat
```

指定用户和会话：

```bash
pnpm --filter aide chat -- --user user-001 --thread feedback-session
```

- `user` 用于隔离 PostgreSQL 中的长期记忆。
- `thread` 用于隔离当前进程内的短期记忆。
- `/clear` 清除当前会话短期记忆。
- `/exit` 退出。

短期记忆只在当前进程内保存，并按 `SHORT_TERM_MAX_TURNS` 限制最近轮数。长期记忆通过 `save_memory` 工具写入 PostgreSQL，可以在进程重启后继续召回。

## Web Admin 集成

通用的 RAG、DeepSeek、PostgreSQL 向量库和长期记忆逻辑位于 `packages/feedback-ai`。CLI 与 Web API 复用同一套实现：

- `web-h5`：`POST /api/feedback/features/admin/assistant/chat`，先验证管理员 Bearer Token，再以 SSE 返回 token。
- `web-admin`：`/feedback` 页面右上角的“AI 助手”负责提交问题、展示流输出和维护最近 16 条短期上下文。
- 长期记忆：Web 端使用 `admin:<管理员 ID>` 隔离；客户端不能指定或伪造这个 ID。

启动本地页面：

```bash
pnpm dev:h5
pnpm dev:admin
```

DeepSeek、Embedding 和 PostgreSQL 相关环境变量需要配置在 `apps/web-h5/.env.local` 或服务端部署环境中，不能添加 `VITE_*` 或 `NEXT_PUBLIC_*` 前缀。知识库仍是导入时的快照；MySQL 产品反馈变更后，需要重新执行 `pnpm --filter aide ingest`。
