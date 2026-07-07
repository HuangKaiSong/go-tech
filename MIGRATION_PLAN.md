# go-tech-frontend 架构重构计划

> 借鉴 [go-tech-admin](https://github.com/Ohh-889/go-tech-admin) 的「分层 / 跨端 / 可复用」架构，对 `go-tech-frontend` monorepo 进行渐进式重构。
>
> 本文档为**方案设计**，不含代码改动。请审阅后再决定是否执行，可按阶段分批落地。

---

## 1. 背景对比

### go-tech-admin 的核心思想

go-tech 不是一个 admin 应用，而是一套**分层基础设施**。应用（`apps/*`）只是薄壳，真正的能力沉淀在数十个 workspace 包中，形成清晰的单向依赖：

```
Applications (apps/*)            ← 业务薄壳，只写页面与装配
        ▲
Web Kit (packages/web/*)         ← 布局 / 主题 / UI / 构建预设
        ▲
Adapter (@go-tech/adapter-*)      ← UI 库适配层
        ▲
Core (packages/@core/*)          ← 平台无关内核，禁止依赖 DOM
```

配套工程化：Turborepo（任务缓存 + 并行编排）、pnpm catalog（版本统一锁定）、oxlint + oxfmt（毫秒级质量检查）、Jotai + TanStack Query + 类型安全 Axios（数据/状态基础设施）。

### go-tech-frontend 现状

| 维度        | 现状                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| 应用        | `web-h5`(Next.js 16)、`web-admin`(Vite 7)、`hr-pc-manager`(Vite 5)、`hr_mobile_manager`(Vite 5)       |
| 共享包      | `@go-tech-frontend/ui`、`/lib`、`/styles`、`/three`                                                   |
| 版本统一    | ✅ 已采用 pnpm catalog（含 react18/react19 分离 catalog）                                             |
| 任务编排    | ❌ 无，靠根 `package.json` 手写 `--filter` 脚本                                                       |
| Lint/Format | ❌ 每个 app 各有 `eslint.config.*` + 根 `.prettierrc`，无统一                                         |
| 共享 UI     | ⚠️ 部分共享。`web-admin` 用 `packages/ui`，但两个 HR 应用各自维护 **49 个**本地 `components/ui/` 组件 |
| 请求层      | ❌ 无共享。`web-h5` 有 server-only `Http` 类，其余应用各自 fetch                                      |
| 状态/数据   | 分散：`web-h5` 用 Context，`web-admin` 用 React Query + 小型 `store/global`，HR 应用各自实现          |

**最大痛点**：两个 HR 应用各 49 个 UI 组件、与 `packages/ui` 的 32 个组件三方重复；请求/鉴权逻辑在每个应用里重写。这正是分层架构要消除的。

### 关键差异（决定不能 1:1 照搬）

1. go-tech 是**纯 Vite + Antd admin**；本仓库是 **Next.js + Vite 混合**、客户端门户 + HR 多端，UI 基于 **Radix + Tailwind + CVA**（非 Antd）。
2. 因此「Adapter 层（Antd 适配）」「TanStack Router」等不直接适用——本仓库 Next.js 用 App Router，Vite 应用用 react-router-dom v6。
3. 可借鉴的是**思想与分层方式**，而非具体技术选型。下面的方案据此裁剪。

---

## 2. 目标架构

保留现有技术栈（Radix/Tailwind/CVA、Next.js + Vite 双栈、react-router），引入 go-tech 的分层与工程化：

```
apps/                            业务薄壳（页面 + 装配）
  web-h5 · web-admin · hr-pc-manager · hr_mobile_manager
        ▲ 依赖
packages/web/*                   Web 工程层（依赖 DOM 允许）
  ui (Radix+CVA 组件库) · layouts · theme · styles · three
        ▲ 依赖
packages/core/*                  跨端内核（禁止依赖 DOM / 框架）
  utils · http · service · types · hooks(纯逻辑)
        ▲ 依赖
internal/*                       工程配置（不参与运行时）
  tsconfig · oxlint-config · tailwind-config
```

### 包命名约定（沿用 go-tech 思路）

| 前缀                | 范围     | 约束                                       |
| ------------------- | -------- | ------------------------------------------ |
| `@go-tech/core-*`   | 跨平台   | **禁止** import DOM / `next` / `react-dom` |
| `@go-tech/web-*`    | 仅 Web   | 可依赖浏览器 / React DOM                   |
| `@go-tech/config-*` | 工程配置 | 仅 devDependency                           |

> 命名空间建议从 `@go-tech-frontend/*` 收敛为更短的 `@go-tech/*`（可选，纯改名成本，靠 catalog + 全局替换完成）。

---

## 3. 分阶段实施

每个阶段独立可交付、可回滚。建议顺序执行；阶段 0/1/2 风险低、收益高，优先做。

### 阶段 0 — 工程化地基（低风险，1 步到位）

**目标**：引入 Turborepo + 统一 lint/format，不动任何业务代码。

1. 根目录新增 `turbo.json`，定义 `dev` / `build` / `lint` / `type-check` / `format` pipeline，配置 `dependsOn: ["^build"]` 与产物缓存（`.next`、`dist`、`tsbuildinfo`）。
2. 根 `package.json` 脚本改为 `turbo run build` 等，保留现有 `--filter` 快捷脚本作为别名。
3. 新增 `internal/tsconfig`（`@go-tech/config-tsconfig`）集中基础 `tsconfig.base.json`，各 app `extends` 它。
4. **oxlint + oxfmt 迁移**（对齐 go-tech）：
   - 根目录加 `.oxlintrc.json` + `.oxfmtrc.json`，迁移现有 ESLint 规则中仍需保留的部分。
   - 渐进策略：先让 oxlint 与现有 ESLint 并存（oxlint 跑全量、ESLint 留 React-specific 规则），验证无误后再移除 ESLint/Prettier。
   - 注意：oxlint 不支持全部 `eslint-plugin-react-hooks` 规则，需评估 `react-hooks` 校验是否保留 ESLint 兜底。

**验收**：`turbo run build` 全绿且有缓存命中；`pnpm lint` 走 oxlint；CI 时间下降。

### 阶段 1 — 抽取 `core` 跨端内核（中风险） ✅ 已完成

> 落地状态（决策：命名空间收敛为 `@go-tech/*`；http 内核为阶段 3 的 Jotai 状态层预留 `onUnauthorized` 注入点）：
>
> - 新增 4 个跨端内核包（均位于 `packages/core/*`，`tsconfig` extends `@go-tech/tsconfig/library.json`，`lib: ["ESNext"]` 不含 DOM）：
>   - `@go-tech/utils`：`cn` / `truncate` / `formatNumber` / 类型守卫。
>   - `@go-tech/hooks`：`useCountDown` / `useLatest`（React peer，timer 用 node 类型，无 DOM）。
>   - `@go-tech/types`：`HttpBaseResponse` / `User` / `Tenant` / `Packages` / `MenuType`。
>   - `@go-tech/core-http`：runtime-agnostic `HttpClient` + 可注入 `HttpAdapter`（`getBaseUrl`/`getToken`/`defaultHeaders`/`onError`/`onUnauthorized`/`returnErrorBody`）。
> - `apps/web-h5/lib/http.ts` 改为注入 Next.js `cookies()` adapter 消费内核；导出 `httpClient`/`getBaseUrl` 不变。
> - `web-h5` 的 `types/*.d.ts` 改为从 `@go-tech/types` re-export（保留全局 ambient，零调用点改动）。
> - 全仓 `@go-tech-frontend/lib` 引用（33 处）重定向到 `@go-tech/utils` / `@go-tech/hooks`；`packages/lib` 保留为已弃用的 re-export shim（沙箱无法删除，可后续手动移除）。
> - `pnpm-workspace.yaml` 增加 `packages/core/*` glob。
> - 验收通过：4 个 core 包 + `web-h5` + `web-admin` 的 `tsc` 全绿；向 core 包注入 `document`/`window` 会编译报错（已实测）。oxlint/oxfmt 为平台原生二进制，请在本机 `pnpm lint` / `pnpm format` 跑。
> - 待办（阶段 1 范围外）：`web-admin` / HR 应用的内联 fetch 迁移到 `core-http` adapter（属阶段 3 service 层）；`web-admin/src/types` 收敛进 `core-types`。

**目标**：把平台无关逻辑下沉到 `packages/core/*`，明确「禁止 DOM」边界。

1. `packages/core/utils`（`@go-tech/utils`）：迁移 `packages/lib` 中纯函数（`cn`、`truncate`、`formatNumber`、类型守卫）。`cn` 依赖 clsx+tailwind-merge，属纯逻辑，可保留在此。
2. `packages/core/types`（`@go-tech/types`）：抽取跨应用共享的领域类型（订单、用户、套餐、HR 实体等，目前散落在各 app 的 `types/`）。
3. `packages/core/http`（`@go-tech/core-http`）：**统一请求内核**。
   - 抽象出与运行时无关的 `HttpClient`（基于 fetch），把「取 token」「baseUrl」「错误处理」做成可注入的 adapter。
   - `web-h5` 注入 Next.js `cookies()` 适配；Vite 应用注入 localStorage/cookie 适配。这样 `web-h5/lib/http.ts` 的 server-only 逻辑与 admin/HR 共用同一内核。
4. `packages/core/hooks`：迁移 `packages/lib` 的 `useCountDown` / `useLatest` 等纯逻辑 hook（不碰 DOM 的）。

**验收**：`core-*` 包 `tsconfig` 设 `lib` 不含 DOM；任何 `import` 浏览器 API 直接编译报错，保证边界。

### 阶段 2 — 消除 UI 组件重复（高收益，中风险）

**目标**：两个 HR 应用的 49×2 个本地组件统一收敛到 `packages/web/ui`。

1. 盘点差异：对比 `packages/ui/src`（32 个）与 `hr-pc-manager` / `hr_mobile_manager` 各自的 `components/ui`（49 个），列出三方差异（缺失组件、定制改动）。
2. 把缺失的 17+ 个组件补全进 `packages/ui`，对有定制的组件用 CVA variant / props 参数化，而非各自 fork。
3. HR 应用逐个删除本地 `components/ui`，改 `import { Button } from "@go-tech/web-ui"`。
4. 注意 React 版本差异：`packages/ui` 需同时兼容 React 18（HR）与 19（web）。用 peerDependencies 声明 `react: ">=18"`，避免重复 React 实例。
5. Tailwind 版本差异（HR v3 / web v4）：把设计令牌抽到 `internal/tailwind-config`（`@go-tech/config-tailwind`），v3/v4 各自的 preset 引用同一份 token 源（颜色、圆角、间距），对齐 go-tech 的 `tailwind-plugin` 思路。

**验收**：删除 ~98 个重复文件；HR 应用 UI 由共享包驱动；改一处组件四端生效。

### 阶段 3 — 共享 service / 状态基础设施（中风险）

**目标**：对齐 go-tech 的 `@go-tech/service`——可复用的请求 + 查询层。

1. `packages/core/service`（`@go-tech/core-service`）：在 `core-http` 之上封装 TanStack Query 的 `queryClient` 工厂、统一 `queryKey` 约定、错误/鉴权拦截与跳转 adapter。
2. 各业务 API 改为「定义一次 service 函数 + 类型」，四端共用。web-admin 现有 React Query 调用迁移到该层。
3. 状态：保持轻量。go-tech 用 Jotai，本仓库可选——
   - **方案 A（推荐，渐进）**：维持现状（web-h5 Context / web-admin 局部 store），仅统一「鉴权状态」到 `core` 的一个 framework-agnostic store helper。
   - **方案 B（彻底对齐 go-tech）**：引入 Jotai 作为跨端原子状态层。成本更高，仅在确有跨端共享状态需求时采用。
   - 此处需你拍板，详见第 5 节。

**验收**：新增一个 API 只写一份 service；鉴权/401 处理集中一处。

### 阶段 4 — 应用瘦身 + 文档（低风险，收尾）

1. 各 app 内残留的工具/类型移入对应 `core`/`web` 包，app 只留页面、路由、装配。
2. 更新 `AGENTS.md` 反映新分层与依赖规则（含「core 禁止 DOM」约定）。
3. 可选：仿 go-tech 增加 `PROJECT_STRUCTURE.md` / `PACKAGE_SPLIT_ARCHITECTURE.md` 说明分层边界。

---

## 4. 风险与缓解

| 风险                                            | 缓解                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| 混合 React 18/19 导致共享 UI 出现重复实例       | 共享包用 `peerDependencies`，由各 app 提供 React；pnpm 已用 catalog 分版本管理 |
| 混合 Tailwind v3/v4                             | 令牌单一来源 + 双 preset；不强行统一 Tailwind 大版本                           |
| Next.js（server-only） vs Vite 的请求层差异     | `core-http` 用 adapter 注入运行时能力，不在内核里 import `next`                |
| oxlint 规则覆盖不全                             | 渐进迁移，ESLint 保留 react-hooks 兜底直至验证完整                             |
| 大范围改名 `@go-tech-frontend/*` → `@go-tech/*` | 可选项；若做，靠 catalog + 全局替换 + 一次性 PR                                |
| 一次性大重构难 review                           | 严格按阶段切分，每阶段一个 PR，独立可回滚                                      |

---

## 5. 需要你确认的决策点

1. **命名空间**：是否把 `@go-tech-frontend/*` 收敛为 `@go-tech/*`？（纯改名，影响范围大但机械）
2. **状态层**：阶段 3 选**方案 A（渐进，不引入 Jotai）**还是**方案 B（引入 Jotai 对齐 go-tech）**？
3. **oxlint**：是否完全替换 ESLint/Prettier，还是 oxlint 为主、ESLint 仅保留 react-hooks？
4. **执行节奏**：先只做阶段 0（地基），还是 0→1→2 一起推进？
5. **HR 应用 UI 收敛**：是否接受为兼容定制而把组件参数化（可能改变现有 HR 视觉的少量细节）？

---

## 6. 建议的落地顺序（TL;DR）

```
阶段0 工程地基 (turbo + oxlint + tsconfig)   ← 先做，低风险高收益
阶段1 core 内核 (utils/types/http/hooks)
阶段2 UI 收敛 (消除 HR 49×2 重复)            ← 收益最大
阶段3 service/状态层
阶段4 应用瘦身 + 文档
```

每个阶段建议独立 PR、独立验收。确认上面 5 个决策点后，我可以从阶段 0 开始逐步实施。
