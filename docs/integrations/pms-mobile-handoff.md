# PMS 移动端登录跳转

完整 Authorization 不进入 URL。门户生成 43 字符随机 code，以 URL fragment 传递给移动端；移动端在初始化路由前通过 POST 兑换完整凭证，使用既有 setToken 存储，再由现有 /pms-admin/web-back/admin/info 接口校验用户。

## 上线步骤

1. 门户配置 `NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST` 为移动端地址（支持 history 和 hash 路由），并配置所有实例一致的 `SESSION_SECRET` 和 `REDIS_URL`。
2. `REDIS_URL` 使用服务端连接字符串，例如 `redis://:password@host:6379/0`；密码中的特殊字符须 URL 编码，启用 TLS 时使用 `rediss://`。本地连接信息已配置在被 Git 忽略的 `.env.local` 中，仓库示例不包含真实凭证。Redis 账号需要具备 GET、SET、DEL 和 EVAL 权限，不需要建表。
3. 应用移动端补丁：

   ```sh
   git -C /Users/huangkaisong/workspace/pms2-mobile apply --ignore-space-change /Users/huangkaisong/workspace/go-tech-frontend/patches/pms2-mobile-authorization-handoff.patch
   ```

4. 移动端的对应 Vite 环境配置增加 `VITE_PMS_HANDOFF_ORIGIN=https://门户实际域名`（只配置源站，不填写移动端域名）。该值是公开的接口地址，不是密钥。
5. 移动端执行 `node --test tests/authorization-handoff.test.mjs` 和 `pnpm build`，然后部署两端。补丁在当前移动端源码上已完成 apply --check；本会话没有移动端目录的写权限，未直接修改或构建该项目。

## 调用方式

普通浏览器的地址跳转不能自行设置 Authorization 请求头，fetch 自动跟随重定向也不会让页面导航。因此提供两个入口：

- `POST /api/pms/mobile/redirect`：请求头携带 `Authorization: Bearer <PMS Token>`，返回 `{ code: 200, data: { url } }`；调用端随后用 `window.location.assign(url)` 导航。
- `GET /api/pms/mobile/redirect`：面向可设置导航请求头的原生 WebView 等调用端，返回 HTTP 303 到移动端短地址。

门户 Client Component 的调用示例：

```ts
import { clientFetch } from '@/lib/client-http/client-fetch';
import { isNotifiedClientHttpError } from '@/lib/client-http/client-http-error';

async function enterMobile(pmsToken: string) {
  try {
    const response = await clientFetch('/api/pms/mobile/redirect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pmsToken}` }
    });
    const result = await response.json();
    window.location.assign(result.data.url);
  } catch (error) {
    if (isNotifiedClientHttpError(error)) return;
    throw error;
  }
}
```

传入的必须是 PMS 后端可识别的用户凭证。门户 platform_customer Token 不会因本功能自动变成 PMS Token；若二者不兼容，需要先完成现有 PMS 登录换取凭证流程。

## 兑换与有效期

- 移动端向门户 `POST /api/pms/mobile/exchange`，JSON body 为 `{ code }`。成功响应包含 `{ code: 200, data: { authorization } }`。
- 兑换接口仅允许配置中移动端的精确 Origin，提供 OPTIONS 预检；不依赖跨站 Cookie。
- code 有效期 60 秒，兑换后删除；通过 Redis Lua 脚本原子执行 GET 和 DEL，保证多个进程/多台服务器并发时仅可消费一次。请求失败后应重新发起跳转获取新 code。
- Redis key 使用 `go-tech:pms-mobile-handoff:v1:` 前缀和 code 的 SHA-256 摘要；value 为 SESSION_SECRET 派生密钥加密的 AES-256-GCM 凭证、目标来源及过期时间。SET 使用 EX 60 和 NX，过期由 Redis 自动清理；兑换后立即删除。
- 移动端立即从地址栏移除 code，清除旧账号凭证，等待兑换后才创建路由；失败时展示提示并回到既有登录流程。
- 所有返回凭证/短地址的响应禁止缓存；接口错误不回显 Token、code 或底层存储错误。

本实现已覆盖 12000 字符 Authorization 的传递测试。最初发给门户的 Authorization 仍属于 HTTP 请求头，如果部署网关或 Node 的请求头上限小于实际凭证大小，会在接口执行前返回 431，需要按实际长度配置这些组件；URL 已不承载完整凭证。

## 验证

```sh
node --import tsx --test apps/web-h5/lib/auth/mobile-handoff.test.ts apps/web-h5/lib/auth/mobile-handoff-store.test.ts
# 使用本地环境连接真实 Redis（仅操作本次随机测试 key）
pnpm --filter web-h5 test:pms-mobile-redis
pnpm --filter web-h5 type-check
pnpm --filter web-h5 build
```

测试覆盖接口契约、加解密、60 秒过期、两个独立 store 的并发兑换及移动端启动流程；Redis 单元测试使用可控替身。本次对截图中 Redis 的 TCP 连接被执行环境拒绝（EPERM），未完成真实 Redis 认证或 PMS 身份接口联调。

多机及 PM2 worker 必须连接同一个 Redis 数据库并使用一致的 SESSION_SECRET。每个 worker 复用一个惰性连接；连接和命令超时均为 5 秒，关闭离线命令队列。Redis 不可用时接口返回通用 503，不回退到文件或进程内存；连接结束后后续请求可以重新建立连接。

本次验证：两端共 16 项功能测试、针对新增代码的 Oxlint/Oxfmt 检查及移动端兑换模块类型检查通过。整应用 `type-check` 在构建重新生成类型后，被现有 confirm-order、invoice、pricing-plan、renew-order 页面的 Next.js 参数/props 类型错误阻塞；Turbopack 构建长时间未完成后中止，Webpack 备用构建在现有 monitor-contract/browser-monitor 包的 TypeScript 源码解析处失败。上述文件均未在本次任务中修改。
