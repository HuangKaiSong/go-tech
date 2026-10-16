# Web Monitor

`web-h5` 的浏览器错误、rrweb JSON 和 Web Vitals 接收服务。仅使用 MySQL 存储，数据位于现有 `go-tech` 库中的 `monitor_*` 表。`web-admin` 的「網頁監控」页面支持查看记录和播放 rrweb 回放。视频转码暂未接入。

## 启动

从仓库根目录执行：

```bash
cp apps/web-monitor/.env.example apps/web-monitor/.env
openssl rand -hex 32
openssl rand -hex 32
```

把两个生成值分别配置为 `MONITOR_INGEST_TOKEN`、`MONITOR_QUERY_TOKEN`，两者必须不同。不要提交 `.env`。

在 `apps/web-h5/.env.local` 配置：

```dotenv
NEXT_PUBLIC_BROWSER_MONITOR_ENABLED=true
NEXT_PUBLIC_BROWSER_MONITOR_RELEASE=local
BROWSER_MONITOR_SERVICE_URL=http://127.0.0.1:8200
BROWSER_MONITOR_INGEST_TOKEN=<与 MONITOR_INGEST_TOKEN 相同>
BROWSER_MONITOR_QUERY_TOKEN=<与 MONITOR_QUERY_TOKEN 相同>
```

分别启动两个终端：

```bash
pnpm --filter web-monitor dev
pnpm dev:h5
```

默认监听 `127.0.0.1:8200`，报告在 MySQL 事务提交后确认接收。启动前必须配置数据库连接和认证加密密钥，并应用表结构迁移。生产运行：

```bash
pnpm --filter web-monitor build
pnpm --filter web-monitor start
```

服务器通过根目录 `ecosystem.config.cjs` 中的 `web-monitor` 进程交给 PM2 管理。首次上线、数据库迁移、H5 配置、验收及后续更新步骤见[上线说明](./DEPLOYMENT.md)。

`NEXT_PUBLIC_*` 在 H5 构建时固化；修改开关或发布版本后需要重新构建。服务 token 只用于服务端，同源浏览器上传不会携带它。启用前需按应用的数据采集政策处理用户告知和授权。

开发时也可以使用局域网 HTTP 地址，例如 `http://192.168.0.168:3001`。SDK 在没有 `crypto.randomUUID()` 时使用 `crypto.getRandomValues()` 生成 UUID；同源接口根据请求的实际 Host 校验 Origin。

如果反向代理改写 Host 或在 HTTPS 外部地址与 HTTP 内部地址之间转发，在 H5 服务端配置 `BROWSER_MONITOR_ALLOWED_ORIGINS=https://portal.example.com`，多个公开 origin 用逗号分隔。只允许明确配置的完整 origin，不支持通配符。

## 接收检查

1. 检查 `http://127.0.0.1:8200/health` 和带 query token 的 `/api/reports`，确认服务和数据库查询正常。
2. 启用 H5 的 `NEXT_PUBLIC_BROWSER_MONITOR_ENABLED=true`，确保两端服务端 ingest token 一致，再重新启动 H5。
3. 页面约十五秒后应上传性能报告，错误报告还包含可用的回放。通过管理员列表确认数据入库。
4. 返回 403 时检查 H5 Origin 校验；503 表示未配置转发或接收并发已满；502 表示接收服务不可达；400 表示协议校验失败。MySQL 故障不会切换到文件存储。

## 管理后台查看

1. 在 H5 服务端设置 `BROWSER_MONITOR_QUERY_TOKEN`，与监控服务的 `MONITOR_QUERY_TOKEN` 相同，修改后重启 H5。
2. 本地开发在 `apps/web-admin/.env.local` 设置 `VITE_H5_SITE_URL=http://localhost:3001`，然后运行 `pnpm dev:admin`。
3. 用正常管理员账号登录，从侧栏进入「網頁監控」，路由为 `/monitor`。错误详情和回放路由为 `/monitor/:id`；性能列表可直接访问 `/monitor?view=performance`。

查询经过管理后台的 `/h5-hook` 代理和 H5 的 `/api/browser-monitor/admin` 接口，沿用现有管理员 JWT 验签与有效管理员校验。浏览器只使用登录凭证，监控 query token 留在 H5 服务端；不要添加 `VITE_MONITOR_QUERY_TOKEN`。

生产部署需将管理后台同源的 `/h5-hook/*` 反向代理到 H5，去掉 `/h5-hook` 前缀，保留管理员 Authorization。Vite 的开发代理不会自动进入生产静态产物。

页面支持路径/会话筛选、加载更多、刷新、错误堆栈、上下文、操作时间线、播放/暂停、进度拖动、倍速、跳至错误和 JSON 下载。性能概览是已加载记录按页面访问去重后的 p75，不是服务端全量统计。

## 接口

| 方法 | 路径                      | 认证         | 返回                                             |
| ---- | ------------------------- | ------------ | ------------------------------------------------ |
| GET  | `/health`                 | 无           | 服务健康状态                                     |
| POST | `/api/reports`            | ingest token | `{ code: 200, data: { id, duplicate } }`         |
| GET  | `/api/reports`            | query token  | 分页摘要，不含回放事件                           |
| GET  | `/api/reports/:id`        | query token  | 完整报告及服务端接收时间 `receivedAt`            |
| GET  | `/api/reports/:id/replay` | query token  | 原始 rrweb 事件 JSON 数组，可以直接传给 Replayer |

认证使用 `Authorization: Bearer <token>`。上传新记录返回 HTTP 201；相同 UUID 重传返回 HTTP 200，保留原记录。最多接收 4 MiB 的未压缩 JSON，并校验共享 `@go-tech/monitor-contract` 协议；异常数据、非法 ID 和缺少完整快照的回放均拒绝。

列表查询支持 `kind=error|performance`、`sessionId`、`path`、`limit=1..100`（默认 20）、`cursor`，以及按发生时间筛选的 `from` / `to`（Unix 毫秒，可单独传入，包含边界，开始不得晚于结束）。管理后台时间输入统一使用 UTC+8，结束时间包含所选分钟。使用返回的 `nextCursor` 查询下一页，并保留原过滤条件。记录过期后游标可能失效，重新查询第一页即可。

```bash
curl http://127.0.0.1:8200/health
curl -H "Authorization: Bearer $MONITOR_QUERY_TOKEN" \
  'http://127.0.0.1:8200/api/reports?kind=error&limit=20'
curl -H "Authorization: Bearer $MONITOR_QUERY_TOKEN" \
  'http://127.0.0.1:8200/api/reports?kind=performance&limit=20'
curl -H "Authorization: Bearer $MONITOR_QUERY_TOKEN" \
  'http://127.0.0.1:8200/api/reports/<report-id>/replay'
```

管理后台应通过自己的鉴权服务代理查询，不能把 query token 写入浏览器环境变量。监控服务默认不启用跨域读取。

## 采集行为

- H5 的 `instrumentation.ts#onRequestError` 上报 Next.js 未处理的服务端请求错误，分类为 `next-server`。主动捕获并返回友好页面的异常须调用 `@/lib/browser-monitor/server` 的 `captureServerError(error)`；Route Handler 应传入 `{ headers: request.headers, path: new URL(request.url).pathname, method: request.method, routeType: 'route' }`。已接入反馈页及反馈登录校验中的数据库故障。未调用此函数的服务端 `catch` 不能由浏览器监控自动识别。
- 服务端错误在发生时记录毫秒时间，直接使用服务端 ingest token 上报，不依赖浏览器初始化。主动处理的异常通过 Next.js `after()` 在响应结束后上传；监控故障不会破坏友好提示。`next-server` 的回放为空，管理端不提供播放器或回放下载。
- React 客户端渲染错误分类为 `react-client`，保留 rrweb 回放。带服务端 digest 的错误边界不再次上传，避免与服务端钩子重复。旧 `react` 分类仍可读取。
- 记录区分发生时间与监控接收时间，管理端以 UTC+8 显示到毫秒。设备信息包含请求 User-Agent、可用的客户端提示；浏览器事件还记录视窗和设备时区。服务端请求没有浏览器视窗或时区时不会伪造这些值。
- 认证信息由 H5 服务端从实际请求补齐，验证可用的 JWT 签名及有效期，区分未登录、已验证、未验证和无效凭证。管理员详情可查看用户 ID、用户名、Token 及 `GO_TECH_AUTH_TOKEN` / `session` 认证 Cookie；密码和其他 Cookie 不采集。认证凭证不进入 rrweb 事件或列表摘要，详情沿用管理员鉴权，数据文件使用受限权限。
- H5 的 `instrumentation-client.ts` 在 React hydration 前初始化 SDK，捕获 JavaScript、未处理 Promise rejection、资源加载和 React 错误。
- `clientFetch` 诊断通道覆盖业务码失败、HTTP 和网络错误，包括 `feedback: 'silent'`。取消请求不报告错误。诊断不影响原 toast 行为，监控上传关闭诊断，避免递归上报。
- 浏览器缓存约 60 秒的完整快照和增量事件，每约 10 秒产生新快照；错误后继续收集最多 5 秒，上传保留完整快照的片段。缓存限制 1.5 MB，单个错误片段限制约 2.5 MB。大页面超出限额时仍保存错误，并标记回放不可用。
- 同一错误五秒内去重，每分钟最多采集十个错误，同时最多缓存三个错误片段。
- Web Vitals 采集 LCP、INP、CLS、FCP、TTFB，每 15 秒以及页面隐藏时上传变化的指标；没有错误也报告。`hasError` 表示该文档是否曾发生错误，`pageId` 区分文档，`sessionId` 在当前标签页刷新时延续。指标以文档初始路径归属，SPA 跳转记录到导航时间线。
- 性能数据为实时测量值，并非所有浏览器都会提供全部指标，也不是对每次 SPA 跳转重新计算的一套指标。
- 上传经过 `/api/browser-monitor` 同源入口，该入口校验 Origin、内容类型、请求体大小和报告协议，按请求来源每分钟限制 60 次。反向代理应覆盖可信来源的 `X-Forwarded-For`。转发失败返回统一错误，不泄露服务响应或凭据。

## 回放范围与数据过滤

保留普通页面文字、按钮文案和 placeholder；所有输入值与 contenteditable 内容继续遮罩。敏感文字区域可加 `data-monitor-mask`、`.monitor-mask` 或 rrweb 默认的 `.rr-mask`；包含个人资料的展示区域应显式标记。文字过滤常见 token、邮箱和 URL 参数，DOM 属性仅保留布局、样式和少量展示字段；文档 URL 移除查询串和 fragment，样式 URL 移除查询参数。不开启 console/network payload 插件；rrweb 不收集 cookie、请求头、表单对象和响应 payload。认证凭证仅作为服务端补齐的报告上下文保存。业务错误只记录分类、业务码及状态。

鼠标移动按 50 ms 采样，回放视口与鼠标使用同一缩放和坐标原点。可见页面每约 10 秒补充完整快照，错误结束时补充时间标记，因此没有 DOM 变化的等待时间也计入回放。旧记录里已被替换成星号的文字和未采集的鼠标移动无法恢复；更新后刷新 H5 页面并重新触发错误，才能验证新录制效果。

录制保留 `data-view-frame`、`data-view-mode` 等已知展示状态，以及常见组件的开关状态、方向和语言属性，确保 H5 的容器断点与模式选择器在回放中仍生效。这些属性仅允许已知值；任意业务 `data-*` 属性继续过滤。旧 JSON 中已被过滤的模式属性无法自动还原，需要重新录制。

敏感区域可加 `data-monitor-block` 或 `.monitor-block` 完全屏蔽。图片、SVG、Canvas、视频和 iframe 默认屏蔽。CSSOM、样式表和 DOM 变化会录制；跨域不可读取的样式表、失效的外部字体/资源可能影响还原。回放重建页面状态，不重新执行原业务逻辑，也不保存 React state 或 JS 堆内存。

页面关闭时会尝试立即上传；浏览器对 keepalive 总请求体限制约 64 KiB，因此大回放在关闭标签页、崩溃或离线时可能丢失。当前没有离线队列与重试。上传并发达到限额时会丢弃额外报告，优先保证应用交互不受监控影响。

## MySQL 存储与配置

服务只使用 MySQL，不再提供文件 adapter、文件镜像、存储切换或文件导入导出命令；历史 JSON 与备份不参与运行。既有备份文件原样保留，清理应遵循备份保留策略。

需要 MySQL 8、InnoDB、至少 16 MiB 的 `max_allowed_packet`。按用户要求复用 `go-tech` 库及连接账号，使用独立连接池和 `monitor_*` 表。迁移记录为 `monitor_schema_migrations`，与 H5 的 `__drizzle_migrations` 独立。现有业务表不参与迁移。

监控服务自己的 `.env` 必须配置：

- `MONITOR_DATABASE_URL`：指向 `go-tech` 库的服务端 MySQL 连接。
- `MONITOR_AUTH_ENCRYPTION_KEY`：64 位十六进制密钥，使用 `openssl rand -hex 32` 生成；已有记录须保留原密钥。
- `MONITOR_AUTH_KEY_VERSION`：默认 `v1`。轮换时在 `MONITOR_AUTH_PREVIOUS_KEYS` 中保留仍被报告引用的旧版本密钥。
- `MONITOR_INGEST_TOKEN`、`MONITOR_QUERY_TOKEN`：两个独立的服务端 token。

连接、密钥、版本、schema 或实例配置校验失败时启动失败。数据库不可用时上传失败，不能先确认再丢弃数据。连接池、等待队列、超时、上传并发和回放解压均有容量限制。

应用迁移：

```bash
pnpm --filter web-monitor db:migrate
```

`db:migrate` 使用 `MONITOR_MIGRATION_DATABASE_URL`，未配置时使用 `MONITOR_DATABASE_URL`，需要监控表的 DDL 权限。服务启动不会自动修改表结构。也可使用 `MONITOR_PROVISION_SOURCE_ENV=/绝对路径/配置文件 pnpm --filter web-monitor db:provision` 读取该文件的 `DATABASE_URL`，确认 `go-tech` 后应用迁移并保存监控配置；该命令不创建数据库或账号，不覆盖已有加密密钥。

完整中文注释建表语句见 [`sql/schema.sql`](./sql/schema.sql)，该文件仅供结构查阅，初始化和升级统一使用版本化迁移。已执行的初始迁移保持不可变。`drizzle/0001_monitor_chinese_comments.sql` 为六张表及全部 41 个字段补充中文数据库注释，不改变字段类型、可空性、自增或业务数据。`src/db/comments.ts` 维护注释规范，真实数据库测试核对所有表和字段的注释。

报告索引、详情、认证密文和回放在同一事务内写入；重复 UUID 不覆盖原记录或接收时间。列表仅查询脱敏摘要，按接收时间与 UUID 降序进行游标分页。详情一次一致读取；回放独立 gzip 存储并校验大小、顺序与哈希。JSON 列保存规范化文本字符串，避免性能指标浮点精度变化。

默认保留七天、最多 10000 份报告。查询直接排除过期记录，定时任务通过数据库维护锁协调分批清理；不再等待文件镜像。历史导入审计表保留用于追溯，成功审计独立保留 30 天，异常审计不会自动删除。

`GET /api/storage`（query token）只返回固定的 MySQL 来源和数据库查询统计；`POST /api/storage/switch` 已移除。旧 `MONITOR_STORAGE`、`MONITOR_QUERY_STORAGE`、`MONITOR_DATA_DIR`、文件镜像和切换配置不再生效。

## 验证与备份

```bash
pnpm --filter web-monitor type-check
pnpm --filter web-monitor test
pnpm --filter web-monitor build
pnpm --filter web-monitor lint
MONITOR_TEST_DATABASE_URL='<专用测试连接>' pnpm --filter web-monitor test
MONITOR_TEST_DATABASE_URL='<专用测试连接>' pnpm --filter web-monitor reports:benchmark
```

真实 MySQL 测试和容量测试只创建、删除随机命名的隔离 schema；未提供测试连接时真实数据库测试会明确跳过。容量测试默认准备 100000 条合成性能报告。

恢复使用 MySQL 备份；认证加密密钥须单独受控备份。SQL 备份包含回放二进制列时使用 `mysqldump --hex-blob` 并按原始字节保存，恢复到隔离库后核验完整报告。旧文件不能通过环境变量重新启用为运行存储。部署与核验记录见[实施记录](./DATABASE-MIGRATION-RESULTS.md)，[原迁移计划](./DATABASE-MIGRATION-PLAN.md)保留为历史过程说明。
