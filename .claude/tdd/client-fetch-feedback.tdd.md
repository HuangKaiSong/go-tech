# 客户端请求错误反馈 TDD 证据

## 来源计划

- [客户端请求错误反馈改造计划](../plans/client-fetch-feedback.plan.md)
- 第一轮实施阶段 0–3：基础设施、全局通知器和 `go-now` 试点；用户确认后继续实施阶段 4 客户端调用点迁移。

## 用户旅程

1. 用户触发客户端请求且后端返回非 200 业务码时，可以立即看到后端业务说明，成功流程不会继续。
2. 用户触发客户端请求且服务返回无报文的 HTTP 错误时，可以看到对应状态提示。
3. 用户断网时可以看到网络错误提示；页面切换主动取消请求时不会收到干扰提示。
4. 业务方法不导入 `toast`；统一通知器负责展示，服务端请求边界保持不变。
5. PMS/HR 进入系统和免费试用的成功行为保持原样。

## RED / GREEN 记录

| 阶段 | 测试目标 | RED 证据 | GREEN 证据 |
| --- | --- | --- | --- |
| 客户端请求契约 | `lib/client-http/client-fetch.test.ts` | `Cannot find module './client-http-error'`，退出码 1 | 11/11 通过 |
| 状态码消息映射 | `lib/client-http/error-message.test.ts` | `Cannot find module './error-message'`，退出码 1 | 4/4 通过 |
| go-now 统一错误反馈 | `app/lib/go-now.test.ts` | 业务失败和 HTTP 503 未 reject；断网仅抛原始 `TypeError`，3 个失败 | 接入 `clientFetch` 后 15/15 通过 |
| go-now 未处理 Promise 收口 | `app/lib/go-now.test.ts` | 三个已通知请求错误继续向 React 点击处理器 reject，3 个失败 | 公共请求函数消费已通知错误后 15/15 通过；未知错误仍抛出 |
| 局部重复提示防护 | `lib/client-http/client-fetch.test.ts` | `isNotifiedClientHttpError is not a function`，1 个失败 | 已通知错误可被调用点识别，12/12 通过 |
| 支付 loading 提示复用 | `lib/client-http/client-fetch.test.ts` | 事件生成新 ID，没有复用 `payment-loading`，1 个失败 | `feedbackId` 原样透传，13/13 通过 |
| 自定义取消原因保留 | `lib/client-http/client-fetch.test.ts` | 自定义取消被包装成 `ClientHttpError`，1 个失败 | 已中止 signal 原样抛出且无事件，14/14 通过 |

RED/GREEN 过程先保存在本报告中；用户明确提出后，阶段 0–3 已提交为 `7082d2e`。

## 测试规格

| # | 保证行为 | 测试文件 | 类型 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | HTTP 200 + 数字/字符串业务码 200 成功 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 2 | 成功响应的原始 body 仍可由调用方读取 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 3 | 非 200 数字/字符串业务码发布一次安全业务错误 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 4 | 消息优先级为 `message`，且事件不泄露 payload | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 5 | HTTP JSON/纯文本/空响应分别采用正确提示来源 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 6 | 网络失败发布错误，AbortError 静默 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 7 | `feedback: 'silent'` 不发布事件但仍中断成功路径 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 8 | 只检查顶层 `code` | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 9 | 常见 HTTP 状态映射到本地化 key | `lib/client-http/error-message.test.ts` | 单元 | PASS |
| 10 | go-now 的成功 URL、鉴权头和 PMS/HR 分流保持不变 | `app/lib/go-now.test.ts` | 集成 | PASS |
| 11 | go-now 业务失败、HTTP 503、断网均发布一次反馈且不继续打开系统 | `app/lib/go-now.test.ts` | 集成 | PASS |
| 12 | HR host 缺失的既有回调仍生效 | `app/lib/go-now.test.ts` | 回归 | PASS |
| 13 | 已由全局层反馈的错误不会再触发局部错误 toast | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 14 | 支付请求可复用 loading toast ID 展示全局错误 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |
| 15 | AbortController 自定义取消原因保持原样且静默 | `lib/client-http/client-fetch.test.ts` | 单元 | PASS |

## 实际验证命令与结果

```text
pnpm --filter web-h5 exec tsx --test app/lib/go-now.test.ts lib/client-http/client-fetch.test.ts lib/client-http/error-message.test.ts
结果：33 tests，33 pass，0 fail。

pnpm --filter web-h5 exec vitest run app/components/feedback/submission-lock.test.ts app/api/feedback/turnstile-policy.test.ts
结果：2 files，5 tests，全部通过。

pnpm --filter web-h5 type-check
结果：通过。

pnpm --filter web-h5 lint
结果：退出码 0；仅有既存 WithIframeRestriction.tsx exhaustive-deps warning。

pnpm --filter web-h5 build
结果：Next.js 16.3.0 production build 通过，77 个静态页面生成完成。

pnpm --filter web-h5 exec node --import tsx --test --experimental-test-coverage app/lib/go-now.test.ts lib/client-http/client-fetch.test.ts lib/client-http/error-message.test.ts
结果：行覆盖率 95.54%，分支 90.42%，函数 98.68%。
```

## 浏览器 QA

- 本地生产构建 `http://localhost:3200/zh-cn` 正常加载。
- `NextIntlClientProvider` 页面正常渲染，Sonner Notifications 容器存在。
- 阶段 4 后再次检查 `/zh-cn/account/login`、`/zh-cn/contact` 和 `/zh-cn/feedback`，页面均正常渲染且控制台无 error。
- 未使用真实账号，也未提交或修改任何数据。
- `go-now` 的真实触发入口需要登录。受只读 QA 和无测试账号限制，本轮未对真实业务失败 Toast 做浏览器端到端触发；该行为由请求事件单元测试、go-now 集成测试、类型检查和生产构建覆盖。

## 已知边界

- 阶段 4 已迁移账户、设置、反馈、订单、支付、轮询、搜索和预取请求。
- Server Component、Route Handler、服务端翻译、BetterStack 上报和第三方服务端请求继续使用原生 `fetch`。
- `NEXT_PUBLIC_HR_TRIAL_HOST` 缺失不是 fetch 错误，继续使用现有 UI 回调。
- 旧 `lib/http-fetch.ts` 已无客户端消费者，但文件删除留待阶段 5。
- `app/error.tsx` 的既有用户改动未修改。
- 三个大型 locale JSON 存在历史格式问题；本轮只添加局部翻译区块，没有整文件格式化，避免无关 diff。
