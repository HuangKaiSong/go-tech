# Web Monitor

`web-h5` 的浏览器错误、rrweb JSON 和 Web Vitals 接收服务。当前使用单进程、本地 JSON 文件存储；管理后台可以通过查询接口接入。此阶段提供采集和接口，尚未增加管理后台播放器或视频转码。

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
```

分别启动两个终端：

```bash
pnpm --filter web-monitor dev
pnpm dev:h5
```

默认监听 `127.0.0.1:8200`，数据写入 `apps/web-monitor/data/`。跨容器运行时配置服务地址、监听地址和持久化数据卷。生产运行：

```bash
pnpm --filter web-monitor build
pnpm --filter web-monitor start
```

`NEXT_PUBLIC_*` 在 H5 构建时固化；修改开关或发布版本后需要重新构建。服务 token 只用于服务端，同源浏览器上传不会携带它。启用前需按应用的数据采集政策处理用户告知和授权。

开发时也可以使用局域网 HTTP 地址，例如 `http://192.168.0.168:3001`。SDK 在没有 `crypto.randomUUID()` 时使用 `crypto.getRandomValues()` 生成 UUID；同源接口根据请求的实际 Host 校验 Origin。

如果反向代理改写 Host 或在 HTTPS 外部地址与 HTTP 内部地址之间转发，在 H5 服务端配置 `BROWSER_MONITOR_ALLOWED_ORIGINS=https://portal.example.com`，多个公开 origin 用逗号分隔。只允许明确配置的完整 origin，不支持通配符。

## data 目录为空时

1. 检查 `http://127.0.0.1:8200/health` 是否返回 HTTP 200，并确认两个服务端 ingest token 相同。
2. 设置 `NEXT_PUBLIC_BROWSER_MONITOR_ENABLED=true` 后重启 H5 开发服务，刷新浏览器；生产模式需要重新构建。
3. 打开 H5 页面等待约十五秒，浏览器 Network 应出现 `POST /api/browser-monitor` 并返回 HTTP 200。
4. 返回 403 时检查浏览器 Origin、请求 Host 和反向代理配置；503 表示 H5 未配置监控服务地址或 token；502 表示监控服务不可达或拒绝转发；400 表示上传数据不符合协议。
5. 没有上传请求时检查浏览器控制台中的 `[browser-monitor] Initialization failed`；上传失败在开发环境输出不含凭据的提示。

服务启动本身不会产生 JSON 文件；错误报告和变化的性能指标上传成功后才落盘。`MONITOR_DATA_DIR` 的相对路径以监控服务工作目录为准，使用上述 pnpm 命令时为 `apps/web-monitor`。

## 接口

| 方法 | 路径                      | 认证         | 返回                                             |
| ---- | ------------------------- | ------------ | ------------------------------------------------ |
| GET  | `/health`                 | 无           | 服务健康状态                                     |
| POST | `/api/reports`            | ingest token | `{ code: 200, data: { id, duplicate } }`         |
| GET  | `/api/reports`            | query token  | 分页摘要，不含回放事件                           |
| GET  | `/api/reports/:id`        | query token  | 完整报告，包括错误的 `replay.events`             |
| GET  | `/api/reports/:id/replay` | query token  | 原始 rrweb 事件 JSON 数组，可以直接传给 Replayer |

认证使用 `Authorization: Bearer <token>`。上传新记录返回 HTTP 201；相同 UUID 重传返回 HTTP 200，保留原记录。最多接收 4 MiB 的未压缩 JSON，并校验共享 `@go-tech/monitor-contract` 协议；异常数据、非法 ID 和缺少完整快照的回放均拒绝。

列表查询支持 `kind=error|performance`、`sessionId`、`path`、`limit=1..100`（默认 20）和 `cursor`。使用返回的 `nextCursor` 查询下一页，并保留原过滤条件。记录过期后游标可能失效，重新查询第一页即可。

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

- H5 的 `instrumentation-client.ts` 在 React hydration 前初始化 SDK，捕获 JavaScript、未处理 Promise rejection、资源加载和 React 错误。
- `clientFetch` 诊断通道覆盖业务码失败、HTTP 和网络错误，包括 `feedback: 'silent'`。取消请求不报告错误。诊断不影响原 toast 行为，监控上传关闭诊断，避免递归上报。
- 浏览器缓存约 60 秒的完整快照和增量事件，每约 10 秒产生新快照；错误后继续收集最多 5 秒，上传保留完整快照的片段。缓存限制 1.5 MB，单个错误片段限制约 2.5 MB。大页面超出限额时仍保存错误，并标记回放不可用。
- 同一错误五秒内去重，每分钟最多采集十个错误，同时最多缓存三个错误片段。
- Web Vitals 采集 LCP、INP、CLS、FCP、TTFB，每 15 秒以及页面隐藏时上传变化的指标；没有错误也报告。`hasError` 表示该文档是否曾发生错误，`pageId` 区分文档，`sessionId` 在当前标签页刷新时延续。指标以文档初始路径归属，SPA 跳转记录到导航时间线。
- 性能数据为实时测量值，并非所有浏览器都会提供全部指标，也不是对每次 SPA 跳转重新计算的一套指标。
- 上传经过 `/api/browser-monitor` 同源入口，该入口校验 Origin、内容类型、请求体大小和报告协议，按请求来源每分钟限制 60 次。反向代理应覆盖可信来源的 `X-Forwarded-For`。转发失败返回统一错误，不泄露服务响应或凭据。

## 回放范围与数据过滤

默认掩码所有文本和输入值，过滤 DOM 属性，仅保留布局和样式相关字段；文档 URL 移除查询串和 fragment，样式 URL 移除查询参数。不开启 console/network payload 插件，不收集 cookie、请求头、表单对象和响应 payload。错误消息与堆栈过滤常见 token、邮箱和 URL 参数，业务错误只记录分类、业务码及状态。

敏感区域可加 `data-monitor-block` 或 `.monitor-block` 完全屏蔽。图片、SVG、Canvas、视频和 iframe 默认屏蔽。CSSOM、样式表和 DOM 变化会录制；跨域不可读取的样式表、失效的外部字体/资源可能影响还原。回放重建页面状态，不重新执行原业务逻辑，也不保存 React state 或 JS 堆内存。

页面关闭时会尝试立即上传；浏览器对 keepalive 总请求体限制约 64 KiB，因此大回放在关闭标签页、崩溃或离线时可能丢失。当前没有离线队列与重试。上传并发达到限额时会丢弃额外报告，优先保证应用交互不受监控影响。

## 存储与验证

文件以 UUID 命名，写入临时文件后原子重命名；默认保留七天，最多 10000 个报告，保存时和每小时清理。JSON 文件和目录使用受限权限，数据目录已加入 Git ignore。重启会重新扫描记录并建立摘要索引。此实现只支持一个写入进程，数据目录不要由多个实例同时写入。

```bash
pnpm --filter web-monitor type-check
pnpm --filter web-monitor test
pnpm --filter web-monitor build
pnpm --filter @go-tech/browser-monitor typecheck
pnpm --filter @go-tech/browser-monitor test
pnpm --filter @go-tech/monitor-contract test
pnpm --filter web-h5 exec tsx --test lib/browser-monitor/relay.test.ts lib/client-http/client-fetch.test.ts
```

浏览器冒烟验证：打开 H5 登录页，在开发者工具执行 `setTimeout(() => { throw new Error('monitor-smoke'); }, 0)`，等待约十秒，通过错误列表找到报告并查询回放。刷新一个无错误页面后等待十五秒，查询 performance 列表查看指标。
