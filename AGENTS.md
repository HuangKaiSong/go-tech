# GO-TECH-FRONTEND AGENTS.md

## 适用范围与事实来源

本文件适用于整个仓库。修改某个目录前，若该目录存在更深层的 `AGENTS.md`，以更深层文件为准。

仓库结构和命令会持续演进。发生冲突时，按以下顺序确认事实：

1. 当前目录下的 `package.json`、`pyproject.toml`、`tsconfig*.json` 和构建配置
2. 根目录 `pnpm-workspace.yaml`、`turbo.json`、`.oxlintrc.json`、`.oxfmtrc.json`
3. 本文件

不要根据旧 README、迁移计划或已有 `dist/`、`.next/`、`.venv/` 产物推断当前行为。

## 仓库概览

这是一个由 **pnpm workspace + Turborepo** 管理的 monorepo，包含 TypeScript/React 应用以及一个 Python AI 服务。

- Node.js：根项目要求 `>=20`
- 包管理器：`pnpm@10.17.0`
- 前端运行时：React 19.2.7
- 构建编排：Turborepo 2
- TypeScript/JavaScript 检查：Oxlint
- TypeScript/JavaScript 格式化：Oxfmt
- TypeScript 库构建：主要使用 Tsdown
- TypeScript 测试：主要使用 Vitest，各包独立配置
- Python 工具链：uv、Ruff、mypy、pytest

依赖版本应优先复用 `pnpm-workspace.yaml` 中的 `catalog` / `catalogs`；内部包依赖使用 `workspace:*`、
`workspace:^` 等 workspace 协议。不要为同一依赖在子包中随意引入新的独立版本。

## 工作区结构

```text
apps/
  web-h5/       Next.js 16 客户端门户，App Router
  web-admin/    Vite 管理后台，React Router + Tailwind CSS 4 + Ant Design
  hr-admin/     HR 桌面管理端，Vite + Tailwind CSS 3
  hr_mobile/    HR 移动端，Vite + Tailwind CSS 3
  feedback-ai/  Python/FastAPI/LangChain AI 服务

packages/
  core/         核心能力、基础类型、请求、状态、工具和脚本
  shared/       跨 UI 实现共享的 token 与类型
  primitives/   可跨 UI 体系复用的基础原语
  web/          浏览器/React 专用包及共享业务 UI
  ui/           旧版 @go-tech-frontend/ui 组件库
  styles/       旧版共享样式
  three/        Three.js 能力
  lib/          已废弃的兼容入口

internal/
  config/       Oxlint、Vitest 等共享工程配置
  tsconfig/     共享 TypeScript 配置
  uno-config/   部分管理后台共享包/模板使用的 UnoCSS 配置
```

只把存在 `package.json` 的 `apps/*` 目录视为 pnpm workspace 应用。当前不存在 `hr-pc-manager`、
`hr_mobile_manager`、`hr-system-admin` 等旧应用目录，不要为它们补造命令或架构说明。

## 统一依赖约束

以下版本是当前 workspace 的统一约束，升级时应先修改 `pnpm-workspace.yaml`，再验证所有消费方：

- `react` 和 `react-dom` 运行时统一为 `19.2.7`；根 `overrides` 保证包括宽松 peer range 在内的解析一致。
- `@types/react` 使用 `^19.2.7`，`@types/react-dom` 使用 `^19.2.3`。
- `date-fns` 从 `catalog:utils` 使用 `^4.1.0`。
- `react-day-picker` 从默认 catalog 使用 `^9.13.0`。
- `lucide-react` 从默认 catalog 使用 `^0.562.0`。
- TypeScript 由根 `overrides` 统一到 `^6.0.3`。

新增或修改依赖时：

- React 应用/包不要写入不同的 React 运行时版本，也不要移除根 `react` / `react-dom` overrides。
- `date-fns`、`react-day-picker`、`lucide-react` 必须使用对应 catalog，不要在子包硬编码版本。
- React 组件库将 React、React DOM 作为 peer dependency，并在构建时 external，避免打包多份 React。
- HR 应用不使用 Ant Design；不要因仓库中存在 Ant Design 相关共享包而在 `hr-admin` 或 `hr_mobile` 引入它。

## 应用技术约束

### `apps/web-h5`

- 包名 `web-h5`；Next.js 16.3、React 19、Tailwind CSS 4、App Router。
- 使用 `next-intl`、Jotai、Drizzle ORM、MySQL，并通过内部 API 与 `feedback-ai` 协作。
- `@/*` 指向应用根目录，而不是 `src/`。
- 默认开发端口为 `3001`；`start` 端口为 `3200`。
- 严格区分 Server Component、Client Component、Route Handler 和普通共享模块。
- 只有真正需要状态、Effect、事件或浏览器 API 的组件才添加 `"use client"`。
- `cookies()`、数据库、密钥、服务端 token 和 `server-only` 模块不得进入客户端依赖图。
- 浏览器可见环境变量使用 `NEXT_PUBLIC_*`；敏感变量不得添加该前缀。
- 本目录有更深层的 `apps/web-h5/AGENTS.md`。修改 Next.js 代码前必须先读取它，并按要求优先查阅本地
  `node_modules/next/dist/docs/`，不要依赖旧版 Next.js 经验。

#### 客户端请求与错误反馈

- 浏览器内、由本应用控制的 HTTP 请求统一使用 `@/lib/client-http/client-fetch`。不要在 Client Component、
  客户端 Hook 或 Context 中新增原生 `fetch`，也不要使用旧 `@/lib/http-fetch`；后者依赖服务端翻译入口，不属于
  客户端边界。
- `clientFetch` 保持原生 `fetch` 的参数和 `Response` 返回方式，但会检查 JSON 顶层 `code`：数字 `200` 和字符串
  `'200'` 视为成功，其他数字或字符串视为业务失败。只检查顶层 `code`，不得把 `data.code` 当作响应码。
- 业务失败、非 2xx HTTP 响应和网络错误由全局 `ClientHttpErrorNotifier` 统一展示。调用点仍应 `catch` 以终止成功
  流程；若 `isNotifiedClientHttpError(error)` 为真，不要再调用 `toast.error`，避免重复提示。表单校验、loading 和
  success 提示仍由具体交互负责。
- 已存在 loading toast 的操作将其 ID 作为 `feedbackId` 传给 `clientFetch`，让全局错误直接替换该提示，不要在
  catch 中另外 dismiss 后再创建错误 toast。
- 用户主动点击、提交、登录、下单或支付等 `interactive` 请求默认使用自动反馈。搜索、预取、轮询、动态翻译、
  缓存刷新和验证码加载等 `background` 请求必须显式传入 `{ feedback: 'silent' }`，并继续通过页面状态、空态或
  重试入口反馈失败。
- `AbortController` 取消属于控制流，不应显示错误提示。Effect 中的请求必须传递 signal 并在 cleanup 中取消；不要
  把自定义 abort reason 改写成网络错误。
- Server Component、Route Handler、Server Action、服务端翻译、BetterStack 上报和第三方服务端协议继续使用其
  服务端请求入口或原生 `fetch`，不得导入 `clientFetch`。跨端共享的常量/模型模块也不得反向依赖客户端请求模块；
  客户端请求函数应放在单独的 client-only 文件中。
- 请求核心和事件总线不得导入 toast/UI 组件，不得 monkey-patch `globalThis.fetch`。错误事件只传递业务码、HTTP
  状态、用户可见消息和反馈 ID，不得传递响应 payload、Authorization、token、密码或表单内容。

### `apps/web-admin`

- 包名 `web-admin`；Vite、React 19、React Router、TanStack Query、Tailwind CSS 4。
- 同时使用 `@go-tech-frontend/ui`、`@go-tech/package-ui` 与 Ant Design；修改页面时延续所在功能区的既有 UI
  体系，不要无理由混用组件风格。
- 启用了 React Compiler、PWA 和 GLSL 插件。
- `@/*` 指向 `src/*`，`~/*` 指向应用根目录。
- Vite 环境变量使用 `VITE_*`。

### `apps/hr-admin`

- 目录名和包名均为 `hr-admin`；Vite + React 19、Tailwind CSS 3、Radix UI、React Hook Form、Zod 和
  TanStack Query。
- 默认开发端口为 `8080`，`/hr-manage` 在开发环境代理至 `http://localhost:7079`。
- 不使用 Ant Design；新增 UI 延续现有 Radix/Tailwind 体系。
- `@/*` 指向 `src/*`，`~/*` 指向应用根目录。
- `tsconfig.json` 继承 `@go-tech/tsconfig/vite-react.json`；不要恢复应用内重复的完整 TypeScript 配置。
- 代码检查使用 Oxlint，配置继承 `internal/config/oxlint/react.json`；不再直接使用 ESLint，不要增加 ESLint
  脚本、配置或 disable 注释。
- 当前共享 Vite React 配置相对宽松；新增代码仍应提供明确类型，不要因为 `strict: false` 引入新的隐式
  `any`。

### `apps/hr_mobile`

- 目录名和包名均为 `hr_mobile`；Vite + React 19、Tailwind CSS 3、Radix UI、React Hook Form、Zod 和
  TanStack Query。
- 默认开发端口为 `5174`，与 `hr-admin` 共用 `/hr-manage` 后端代理。
- 不使用 Ant Design；新增 UI 延续现有 Radix/Tailwind 体系。
- `@/*` 指向 `src/*`，`~/*` 指向应用根目录。
- TypeScript 配置继承共享 `internal/tsconfig/vite-react.json`，代码检查使用 Oxlint。

### `apps/feedback-ai`

- pnpm 包名为 `feedback-ai`，Python 项目名为 `go-tech-feedback-ai`。
- Python `>=3.11`，依赖与虚拟环境由 uv 和 `pyproject.toml` 管理。
- 使用 FastAPI、LangChain、MySQL、PostgreSQL/pgvector，默认服务端口为 `8100`。
- 前端应用不得直接导入 Python 源码；浏览器只访问 `web-h5` 的管理员 API，不直接访问该服务。
- 除健康检查外的内部请求需要 `X-Feedback-AI-Token`；相关 token 不得使用 `NEXT_PUBLIC_*` 或 `VITE_*`
  前缀。
- Python 格式化/检查使用 Ruff，类型检查使用 strict mypy，测试使用 pytest；不要用 Oxfmt/Oxlint 处理 Python
  文件。
- 新业务模块按 `AssistantModule` / `ModuleDescriptor` 契约放入独立目录，并从统一注册入口注册。

## 包分层与依赖边界

### 核心与平台无关入口

`packages/core/*` 包含 `@go-tech/utils`、`@go-tech/hooks`、`@go-tech/core-http`、`@go-tech/axios`、
`@go-tech/service`、`@go-tech/core-state`、`@go-tech/logger`、`@go-tech/scheduler`、`@go-tech/color`、
`@go-tech/type-utils`、`@go-tech/types` 和 `@go-tech/scripts`。

- 被声明为 platform-neutral 的入口不得直接依赖 DOM、Next.js 或应用代码。
- `@go-tech/utils` 和 `@go-tech/hooks` 的根入口保持平台无关；浏览器能力分别从 `@go-tech/utils/web`、
  `@go-tech/hooks/web` 导入。
- `@go-tech/core-http` 是可注入 adapter 的 fetch 内核；token、base URL、cookie 和 UI 错误提示属于应用
  adapter，不属于内核。
- `@go-tech/types` 只放共享类型，不放运行时逻辑或平台 API。
- `@go-tech/scripts` 是 Node.js 工具包，可以使用 Node API，但不得被浏览器运行时代码依赖。
- 不要把 `packages/core` 目录名理解为所有包都绝对无 DOM；以各包导出、描述和 TypeScript 配置为准。

继承 `@go-tech/tsconfig/library.json` 的包只有 `ESNext` lib，没有 DOM 类型。遇到 `window`、`document`、
`HTMLElement` 等类型错误时，应调整模块边界或增加明确的 Web 子入口，不能通过给平台无关配置全局添加 DOM
来绕过。

### Shared、primitives 与 Web 包

- `packages/shared/ui-tokens`：零运行时依赖的设计 token。
- `packages/shared/ui-types`：跨 UI 实现共享的类型。
- `packages/primitives/filed-form`：包名为 `@go-tech/form`；目录中的 `filed` 是现有命名，不要在任务外顺手
  重命名。
- `packages/web/*`：浏览器、React 或管理后台专用能力，可依赖 DOM。
- `packages/web/package-ui`：包名为 `@go-tech/package-ui`，提供客户端门户和管理端共用的套餐卡片与模型。
- 跨包导入使用公开包名和 `exports`，不要用 `../../packages/.../src` 穿透源码。
- 新增公共 API 时同步维护入口导出、`package.json#exports`、类型声明和测试。

### 旧版包

- `@go-tech-frontend/lib` 已废弃，只用于兼容旧代码。新代码直接使用 `@go-tech/utils` 和
  `@go-tech/hooks`。
- `@go-tech-frontend/ui`、`styles`、`three` 仍被现有应用使用，不能在未迁移调用方的情况下删除。
- 新功能应优先选择当前应用已经采用的包体系；不要仅为“统一”而进行跨应用大规模 UI 迁移。

## TypeScript、React 与检查约定

- 共享 TypeScript 基础配置位于 `internal/tsconfig/`。
- `base.json` 默认开启严格检查、`noUnusedLocals`、`noUnusedParameters`、`isolatedModules` 和
  `verbatimModuleSyntax`；`vite-react.json` 为现有 Vite 应用放宽部分规则。
- 共享 Oxlint 配置位于 `internal/config/oxlint/`；React/Next 应用从对应配置继承，避免复制规则集。
- 纯类型导入使用 `import type`；不要依赖类型导入产生运行时副作用。
- 避免 `any`、非空断言和无边界类型断言；在 HTTP、存储和第三方数据入口处做校验或收窄。
- 保持组件和工具文件为 kebab-case，延续所在目录的导出方式。
- 除非存在明确性能问题，不要主动添加 `useMemo` 或 `useCallback`。React Compiler 已覆盖部分应用；优先保证
  逻辑清晰和依赖正确。
- Hook 必须遵循调用顺序规则；Effect 中订阅、定时器和请求应正确清理。
- 不要通过复制公共实现解决跨应用复用问题；先判断它属于 core、shared、primitives、web 还是应用本地能力。

## 样式与 UI 约定

- 不要假设全仓库使用同一 CSS 方案：`web-h5`、`web-admin` 使用 Tailwind CSS 4；`hr-admin`、
  `hr_mobile` 使用 Tailwind CSS 3。
- Ant Design 只在采用它的 Web 管理端和相关共享包中使用；HR 应用使用 Radix/Tailwind，不使用 Ant Design。
- 修改共享组件时验证所有实际消费方，尤其注意 Tailwind 3/4、React 解析和主题 token 差异。
- 复用已有 token、CVA variant 和组件 API；避免在页面中散落重复颜色与间距常量。
- 保持可访问性：使用语义化元素，交互控件支持键盘操作，表单有标签，图标按钮有可访问名称。

## 常用命令

从仓库根目录运行：

```bash
pnpm install

pnpm dev                 # Turbo 启动所有声明 dev 的 workspace
pnpm build               # Turbo 按依赖图构建
pnpm type-check          # 运行名称精确为 type-check 的 Turbo 任务
pnpm lint                # 根目录 Oxlint 检查
pnpm format:check        # 检查 Oxfmt 格式
pnpm format              # 写入 Oxfmt 格式化结果
```

根快捷命令：

```bash
pnpm dev:h5
pnpm build:h5
pnpm start:h5

pnpm dev:admin
pnpm build:admin
pnpm preview:admin

pnpm dev:hr-m
pnpm build:hr-m

pnpm dev:hr-admin
pnpm build:hr-admin

pnpm dev:feedback-ai
pnpm test:feedback-ai
pnpm ingest:feedback-ai
```

根 `package.json` 虽然定义了 `start:hr-m` 和 `start:hr-admin`，但两个 HR 应用目前没有 `start` 脚本，因此不要
把这两个快捷命令当作可用命令；如需预览 Vite 产物，使用目标包的 `preview` 脚本。

目标应用/包命令示例：

```bash
pnpm --filter hr-admin type-check
pnpm --filter hr-admin test
pnpm --filter hr_mobile type-check

pnpm --filter feedback-ai install:python
pnpm --filter feedback-ai type-check
pnpm --filter feedback-ai lint
pnpm --filter feedback-ai test

pnpm --filter @go-tech/utils typecheck
pnpm --filter @go-tech/service test
pnpm --filter @go-tech/package-ui build
```

注意：仓库同时存在 `type-check` 与 `typecheck` 两种脚本名。根命令 `pnpm type-check` 对应 Turbo 的
`type-check` 任务，不会自动执行仅声明 `typecheck` 的包。验证改动时应读取目标包的 `package.json` 并运行它实际
声明的脚本，不能把根 `type-check` 成功表述为全仓库所有包均已通过类型检查。

## 修改与验证流程

1. 先确认目标应用/包及其 `package.json` 或 `pyproject.toml`、入口和消费方。
2. 保持改动集中，不修改任务无关的已有用户改动。
3. 优先运行目标 workspace 的类型检查和测试，再按影响范围运行构建。
4. 修改共享包时至少验证该包以及直接受影响的应用。
5. 只格式化本次涉及的文件；不要为了格式化制造全仓库无关 diff。

最低验证建议：

- 文档或配置：运行相关配置检查以及针对文件的 Oxfmt 检查。
- TypeScript 应用代码：目标应用 type check + build；有相关测试时运行测试。
- Python 服务：Ruff + mypy + pytest；按需要运行 compile/build。
- 共享包：包级 typecheck/test/build + 至少一个真实消费方的 type check/build。
- HTTP、认证、数据库迁移、AI 提示词/检索、路由生成和构建配置属于高风险变更，应增加针对性验证。

不要编辑或提交 `node_modules/`、`dist/`、`.next/`、`.turbo/`、`.venv/`、`__pycache__/`、`.pytest_cache/`、
`.mypy_cache/`、`.ruff_cache/`、`coverage/` 等生成产物。不要提交 `.env*` 中的密钥、token、证书或真实生产配置。

## 代码风格与提交

Oxfmt 是 TypeScript/JavaScript/JSON/Markdown 格式事实来源。当前关键规则包括：

- 单引号
- 分号
- 2 空格缩进
- 120 字符行宽
- 无尾随逗号
- 自动排序 import 与 `package.json`

不要按旧 Prettier 规则手工改回双引号、80 字符或 ES5 trailing comma。Python 代码遵循 Ruff 配置，行宽同样为
120。

提交信息使用：

```text
<type>(<scope>): <description>
```

常用类型为 `feat`、`fix`、`refactor`、`chore`、`docs`、`test`。只有用户明确要求时才创建提交或推送远端。
