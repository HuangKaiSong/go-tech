# 运行时配置

`web-admin → 系统设置 → 运行配置`（`/settings/runtime-config`） 管理当前连接的 H5 实例。基础设施配置位于本机 SQLite，其余配置位于该实例当前 MySQL。所有接口要求有效的平台管理员凭证；密钥不会回传到浏览器，公开 SSE 仅发送白名单字段。

## 首次部署

要求 Node.js >=22.13；Node 22 的内置 SQLite 仍可能输出 experimental warning。

1. 在服务的部署环境中固定配置 `RUNTIME_CONFIG_ENCRYPTION_KEY`：32 字节随机密钥的 64 位十六进制字符串。可以用 `openssl rand -hex 32` 生成一次，交给部署密钥管理。初始化命令与运行服务必须使用同一密钥；不要将它保存在数据库或提交到 Git。
2. 可选配置绝对路径 `H5_RUNTIME_CONFIG_SQLITE_PATH`。本地默认 `apps/web-h5/data/runtime-config/config.sqlite`；standalone 启动脚本会在切换工作目录前固定路径。Docker 默认 `/app/data/runtime-config/config.sqlite`，Compose 已挂载独立 volume。
3. 保留原环境变量，先运行 `pnpm --filter web-h5 db:migrate`，再运行 `pnpm --filter web-h5 run config init`。初始化按 Next.js 的环境变量优先级和变量展开规则读取配置，只补充缺失项，不覆盖已保存字段。若初始化中断，可在排除故障后重复执行。
   可先运行 `pnpm --filter web-h5 db:migrate --check`，只检查驱动加载、连接配置及迁移文件，不连接或修改数据库。迁移命令使用应用自己的 `mysql2` 驱动，不依赖 Drizzle Kit 在 pnpm 独立目录中发现驱动。

   `config` 与 pnpm 内置命令同名，必须使用 `pnpm --filter web-h5 run config ...`，不要省略 `run`。

4. 构建并部署前后台。构建不会初始化 SQLite 或写入配置。首次部署完成后，修改后台配置不需要构建或重启。

`DATABASE_URL`、`REDIS_URL`、`SESSION_SECRET`、`PLATFORM_JWT_SECRET` 的覆盖值保存在 SQLite；环境变量可保留作默认值。API 地址、试用地址、支付、默认语言、时区、翻译、AI、验证码、日志和监控配置保存在 MySQL。

当前仅 DeepL、Google 提供真实的外部翻译实现，后台提供这两种选择。`GO_TECH_TIMEZONE` 用于 next-intl 日期格式化；不会重写数据库时间或订单期限。

优先级为已保存覆盖值、环境变量、代码默认值。“清空”是显式空字符串，不回退环境值；“恢复环境默认”删除覆盖值。基础设施配置及带默认值的必要业务配置不得清空；空的启动环境变量按未配置处理。

## 修改连接和密钥

修改 MySQL 地址前，需要自行完成目标库的结构迁移及业务数据迁移。后台验证所有声明的表及列、业务配置和当前管理员，展示目标库配置差异后才能保存。保存时会再次验证，失败保留旧地址；成功后采用目标库已有配置，不复制业务数据。

同一请求固定数据库连接与配置快照；旧请求结束后释放旧连接池，新请求读取新连接。服务端优先使用 `API_INTERNAL_URL`，为空时使用 `NEXT_PUBLIC_API_URL`；浏览器代理使用后者。Redis 连接先测试再替换，不迁移原 Redis 数据。切换 Redis 可能使移动端交接码失效。

会话签名和管理员验签密钥立即切换，不保留旧钥验证。修改 `PLATFORM_JWT_SECRET` 必须同步外部平台签发服务，否则管理员无法继续访问。用户主动保存这些配置即执行切换。

SQLite 或加密数据损坏会明确报错。MySQL 短暂不可用时，运行进程可保留同一数据库最近一次成功读取的业务配置；认证和业务数据库操作本身仍可能失败。冷启动没有旧快照时直接报错，不使用其他数据库的配置。

## SSE 与反向代理

门户通过 `/api/runtime-config/events` 获取初始快照与更新；每 15 秒发送心跳，进程每秒检查版本。保存成功时立即广播，客户端断线后退避重连，45 秒未收到数据则重建连接。页面后台暂停，回到前台或恢复网络时重新连接。

生产反向代理应关闭该路径的缓冲、缓存和压缩缓冲，并将读取超时设置为大于心跳间隔，例如 75 秒。Nginx 示例：

```nginx
location = /api/runtime-config/events {
    proxy_pass http://h5_upstream;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 75s;
    gzip off;
}
```

`web-admin` 生产服务继续将 `/h5-hook/*` 转发到 H5，并保留 Authorization 请求头。浏览器只连接同源地址，后台管理不需要开放跨域。

默认语言变化后，当前页面保留用户语言，必要时补充 URL 语言前缀。支付开关更新会清除失效的选项；已暂存的收银台跳转保留其地址。SSE 不自动修改已有订单记录。

## 本机恢复与备份

以下命令在源码目录执行，需要同一部署加密密钥和 SQLite 路径：

```bash
pnpm --filter web-h5 run config inspect
pnpm --filter web-h5 run config backup /absolute/backup/config.sqlite
pnpm --filter web-h5 run config recover /absolute/private/recovery.json
pnpm --filter web-h5 run config set infrastructure /absolute/private/changes.json
pnpm --filter web-h5 run config set business /absolute/private/changes.json
```

JSON 文件为配置键到新字符串值的映射，`null` 表示删除覆盖值。文件中可能含有密钥，应限制权限并在使用后妥善清除。命令不输出配置密钥原文。

`recover` 仅依赖主机文件权限、SQLite 和加密主密钥，可在 MySQL 或 JWT 认证不可用时恢复基础设施配置；它有意跳过在线连接测试。`set` 执行正常校验，包括切库验证；服务器操作员使用它时即确认目标库配置。

生产 standalone 构建附带无需 tsx/pnpm 的命令：在 standalone 的 `apps/web-h5` 目录运行 `node scripts/runtime-config.mjs inspect` 等。Docker 示例：

```bash
docker compose -f compose.h5.test.yaml exec h5 node scripts/runtime-config.mjs inspect
```

备份使用 Node SQLite backup API；Node 22.13–22.15 使用 SQLite 的 `VACUUM INTO` 一致性快照。不直接复制正在写入的数据库文件。恢复备份时先停止服务，完整替换数据库及其 WAL/SHM 状态，再启动；同时恢复对应的部署加密主密钥。不要把 SQLite 文件打进镜像或放入公开目录。

当前方案只支持同一主机的持久化 SQLite 文件。扩展到多主机之前，需要将基础设施配置迁移至共享配置服务。

## 验证

```bash
pnpm --filter web-h5 type-check
pnpm --filter web-h5 test
pnpm --filter web-admin type-check
pnpm --filter web-admin exec vitest run src/pages/runtime-config/runtime-config.test.tsx
pnpm --filter web-h5 build
pnpm --filter web-admin build
```

真实切库集成检查只读取显式 `RUNTIME_CONFIG_TEST_MYSQL_URL`，拒绝非本机地址，创建随机命名的临时数据库并在结束后删除；绝不读取业务 `DATABASE_URL`。对可丢弃的本机 MySQL 执行：

```bash
RUNTIME_CONFIG_TEST_MYSQL_URL=mysql://test-user@127.0.0.1:33378 pnpm --filter web-h5 test:runtime-config:integration
```

构建完成后，可给集成命令追加 `--standalone`，将产物复制到仓库外的临时目录，移除环境文件并验证接口、SSE、代理、切库和恢复命令，避免误用仓库依赖。
