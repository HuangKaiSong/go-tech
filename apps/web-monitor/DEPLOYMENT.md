# Web Monitor 上线说明

本文命令均从仓库根目录执行。监控只使用现有 `go-tech` MySQL 库中的 `monitor_*` 表，不导入本地 JSON 或历史备份。

## 1. 准备运行环境

- 使用与当前验证环境一致的 Node.js 24、仓库要求的 `pnpm@10.17.0`，并确保部署账号可执行 PM2。
- PM2 使用该账号 PATH 中的 `node`，须支持 `--env-file`；构建与 PM2 运行应使用相同 Node 环境。
- MySQL 需要 8.x、InnoDB，`max_allowed_packet` 至少 16 MiB；部署机器能够访问数据库。
- 默认监控监听 `127.0.0.1:8200`，同机 H5 通过内部地址访问，无需为监控开放公网端口。先确认该端口没有其他开发服务占用。

```bash
node --version
pnpm --version
pm2 --version
pnpm install --frozen-lockfile
mkdir -p logs
```

安装阶段需要构建和迁移所用的开发依赖。生产产物仍需 `mysql2`、`drizzle-orm` 等运行依赖，不能只复制 `dist/` 后省略依赖安装。

## 2. 配置监控环境变量

只在首次部署且文件不存在时创建配置：

```bash
test -f apps/web-monitor/.env || cp apps/web-monitor/.env.example apps/web-monitor/.env
chmod 600 apps/web-monitor/.env
```

在 `apps/web-monitor/.env` 填写：

```dotenv
MONITOR_HOST=127.0.0.1
MONITOR_PORT=8200
MONITOR_DATABASE_URL=mysql://<账号>:<经过URL编码的密码>@<数据库地址>:3306/go-tech
MONITOR_INGEST_TOKEN=<独立的上传token>
MONITOR_QUERY_TOKEN=<独立的查询token>
MONITOR_AUTH_ENCRYPTION_KEY=<64位十六进制密钥>
MONITOR_AUTH_KEY_VERSION=v1
MONITOR_RETENTION_DAYS=7
MONITOR_MAX_REPORTS=10000
```

首次可分别执行三次 `openssl rand -hex 32`，用于两个不同的服务 token 和独立的加密密钥。更新已有部署时保留原配置和加密密钥；不能每次上线重新生成密钥，否则已有详情中的认证凭证无法解密。数据库账号、token 和密钥不写入 PM2 配置或 Git。

其他连接池、查询超时、上传并发和清理批次参数沿用 `.env.example` 的默认值即可。`MONITOR_STORAGE`、文件镜像和文件目录配置已移除，不需要配置。

## 3. 应用数据库迁移并构建

迁移前确认目标为正式 `go-tech` 库，并按部署环境的备份策略备份监控表和单独保管加密密钥。不要在正式环境执行测试、容量压测或清空数据命令。

```bash
pnpm --filter web-monitor db:migrate
pnpm --filter web-monitor type-check
pnpm --filter web-monitor lint
pnpm --filter web-monitor build
```

`db:migrate` 优先使用 `.env` 中的 `MONITOR_MIGRATION_DATABASE_URL`，未设置时使用 `MONITOR_DATABASE_URL`，需要监控表的 DDL 权限。它使用 `monitor_schema_migrations` 登记已执行版本，与业务应用的迁移记录独立；不会导入历史文件。服务启动仅检查配置和表结构，不自动建表。

确认存在 `apps/web-monitor/dist/main.mjs`。已执行迁移不改写，后续结构调整通过新迁移完成；`sql/schema.sql` 仅供结构查阅，不替代迁移命令。

## 4. 通过 PM2 启动监控

```bash
pm2 start ecosystem.config.cjs --only web-monitor
pm2 status web-monitor
pm2 logs web-monitor --lines 100 --nostream
```

该配置以 `apps/web-monitor` 为工作目录，用 Node 的 `--env-file=.env` 读取监控自己的配置，单实例 fork 运行生产构建，不开启文件监听。缺少 `.env`、数据库配置或表结构时启动失败，先解决日志中的原因再继续上线。

进程异常后延迟 3 秒重启，内存阈值为 1 GiB。PM2 停止超时为 15 秒，覆盖应用自身最长 10 秒的连接排空与数据库连接池关闭时间。

日志位置：

- 标准输出：`logs/web-monitor.log`
- 错误日志：`logs/web-monitor-error.log`

启动后的初步检查：

```bash
curl --fail http://127.0.0.1:8200/health
```

`/health` 表示 HTTP 进程可响应，不包含实时数据库查询；还必须完成下一节的带鉴权查询验证。

## 5. 配置并发布 H5 / 管理端

H5 构建前在其生产环境配置（例如 `apps/web-h5/.env.production.local`）设置：

```dotenv
NEXT_PUBLIC_BROWSER_MONITOR_ENABLED=true
NEXT_PUBLIC_BROWSER_MONITOR_RELEASE=<本次发布版本>
BROWSER_MONITOR_SERVICE_URL=http://127.0.0.1:8200
BROWSER_MONITOR_INGEST_TOKEN=<与监控服务的MONITOR_INGEST_TOKEN一致>
BROWSER_MONITOR_QUERY_TOKEN=<与监控服务的MONITOR_QUERY_TOKEN一致>
```

两个 `NEXT_PUBLIC_*` 值在构建时固化。三个 `BROWSER_MONITOR_*` 值同时必须通过部署平台或现有 secret 注入方式提供给 `go-tech-next` 的 PM2 运行环境：监控服务的 `.env` 不会自动提供给 H5，standalone 进程也不能仅依赖源码目录中的配置文件。

确认 H5 的运行环境已注入上述变量后再执行：

```bash
pnpm build:h5
pm2 restart ecosystem.config.cjs --only go-tech-next --update-env
```

如果 H5 与监控分机部署，改用受控内网服务地址，并相应配置监控监听地址和网络访问范围。

生产管理后台沿用管理员登录鉴权，同源 `/h5-hook/*` 必须代理至 H5 并去掉此前缀、保留管理员 Authorization；不能把监控 query token 放进管理端的 `VITE_*` 配置。已有管理端完成该代理配置时，无需为 PM2 新进程修改前端路由。

## 6. 上线验收与保存进程

带 query token 检查 `GET /api/storage` 及 `GET /api/reports?limit=1`，预期 HTTP 200，来源为 `mysql`。下面的检查直接读取监控 `.env`，不会把 token 写到命令参数或打印报告内容：

```bash
node --env-file=apps/web-monitor/.env --input-type=module <<'JS'
const root = `http://${process.env.MONITOR_HOST || '127.0.0.1'}:${process.env.MONITOR_PORT || 8200}`;
const headers = { Authorization: `Bearer ${process.env.MONITOR_QUERY_TOKEN}` };
for (const endpoint of ['/api/storage', '/api/reports?limit=1']) {
  const response = await fetch(root + endpoint, { headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
  const body = await response.json();
  if (endpoint === '/api/storage' && body.data?.storage !== 'mysql') throw new Error('Unexpected storage');
  console.log(`${endpoint}: HTTP ${response.status}`);
}
JS
```

若监听配置为 `0.0.0.0`，本机检查时将脚本的访问地址改为 `127.0.0.1`。

浏览器端验收：

1. 打开正式 H5，等待约十五秒，确认 `POST /api/browser-monitor` 成功。
2. 使用管理员账号进入管理后台 `/monitor`，确认新记录、接收时间和设备信息可查看。
3. 在受控测试页面触发客户端错误，确认错误详情和 rrweb 回放可打开；服务端 `next-server` 错误不提供回放。
4. 确认监控列表可查询，错误日志没有持续数据库或清理失败。

全部验收通过后保存：

```bash
pm2 save
```

如服务器尚未配置 PM2 开机恢复，使用部署账号执行 `pm2 startup`，按其输出完成系统服务配置，再执行 `pm2 save`。Node 路径变更后需相应更新启动服务。日志轮转、磁盘容量、数据库连接数、查询失败及加密密钥备份纳入现有运维管理。

## 7. 后续更新与回退

后续发布同样先安装依赖、审阅并应用新迁移、检查和构建，再只更新监控进程：

```bash
pnpm install --frozen-lockfile
pnpm --filter web-monitor db:migrate
pnpm --filter web-monitor type-check
pnpm --filter web-monitor lint
pnpm --filter web-monitor build
pm2 restart ecosystem.config.cjs --only web-monitor --update-env
```

重新完成健康与数据库查询验收后执行 `pm2 save`。修改监控 `.env` 后也需要重启；PM2 或系统环境里同名变量会优先于 Node 的 `.env`，应避免两处同时维护不同值。

当前配置为单实例，重启期间接收服务会短暂中断；新版 SDK 会在浏览器队列中保留失败报告并重试，更新仍建议安排在低流量窗口。需要回退时恢复上一份与当前 schema 兼容的代码与构建、保留现有密钥和 MySQL 数据，再按同样方式重启及验收；schema 修复使用新迁移，不删除监控表，也不回退到文件存储。

PM2 命令及配置项参考[官方 Ecosystem 文档](https://pm2.keymetrics.io/docs/usage/application-declaration/)、[环境更新说明](https://pm2.keymetrics.io/docs/usage/process-management/)和[开机恢复说明](https://pm2.keymetrics.io/docs/usage/startup/)。

## 8. 弱网补报与本次升级顺序

本次升级新增 `0002_monitor_upload_chunks.sql`。先执行数据库迁移并发布监控服务，再发布 H5；旧版 H5 的整包上报仍兼容，新版 H5 的分片接口需要新版监控服务。新表仍建在现有 `go-tech` 库内，包含所有字段的中文注释和表注释，无需导入历史文件。

浏览器生成报告后先写 IndexedDB 待发送队列，再上传。网络异常、超时、HTTP 408/429/5xx 会重试，间隔从约两秒递增到约一分钟，并遵守 `Retry-After`。每次只发送一个报告，恢复网络、恢复页面和重新打开网站都会检查待补报记录。只在收到完整报告入库确认后删除本地记录；400/403/413 等不可重试错误会删除无效报告。

- 浏览器暂存上限：50 份、20 MiB、24 小时；超限优先淘汰旧报告。浏览器禁用 IndexedDB、存储额度不足或访问失败时降级为有界内存队列，此时退出后无法恢复。
- 错误触发时立即保存脱敏回放检查点，后五秒采集期间每秒更新；正常隐藏或离开页面会提前结束回放。进程直接退出时，可在下次打开后恢复最后一次完成写入的检查点，最迟约六十五秒后可补报。
- 已测量的性能指标也会保存检查点，正常情况仍按十五秒周期汇总上报。
- 大于等于 24,000 字节的报告拆成每片 12 KiB 的二进制内容，以 base64 JSON 传输；每片分别确认并保存进度。未完成分片保存在 MySQL `monitor_upload_chunks`，支持跨服务实例续传，组装校验后按原报告 UUID 幂等入库。临时分片保存 24 小时并由既有定期清理任务删除；同时限制未完成上传任务数，满载返回可重试失败。
- 浏览器暂存和分片均不保存认证 Token/Cookie。跨页面、发生重试或延迟超过一分钟的补报，服务端认证状态为 `unverified`，不附带当前用户凭证，以免误归属到后来登录的账号。

IndexedDB 是浏览器内的临时待发送队列，服务端持久存储始终只有 MySQL。强制退出前尚未完成首次写入、用户清空站点数据、浏览器淘汰存储、超过暂存上限或有效期，以及用户之后不再打开网站等情况，仍无法保证送达。

### 可重复模拟测试

测试机安装 Chrome，并提供可创建、删除临时测试库的专用 MySQL 测试连接；不要指向正式业务库。脚本不读取应用 `.env`，每次创建随机命名的测试库和独立 Chrome 用户目录，结束时删除测试库、浏览器目录和临时构建。

```bash
MONITOR_TEST_DATABASE_URL='<专用测试 MySQL 连接>' pnpm --filter web-monitor test
MONITOR_TEST_DATABASE_URL='<专用测试 MySQL 连接>' pnpm --filter web-monitor test:delivery
```

真实浏览器模拟通过以下四项：断网后关闭页签并重开补报；16 KiB/s 上传、中途分片失败后关闭页签再续传，逐个比较完整回放事件；数据库已提交但确认响应丢失后重试，报告仍只有一份；关闭事件与回放结束定时器执行前使整个浏览器进程崩溃，重启同一浏览器目录后恢复持久检查点。
