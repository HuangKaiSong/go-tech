# GO-TECH-FRONTEND AGENTS.md

## 适用范围与事实来源

本文件适用于整个仓库。修改某个目录前，若该目录存在更深层的
`AGENTS.md`，以更深层文件为准。

仓库结构和命令会持续演进。发生冲突时，按以下顺序确认事实：

1. 当前目录下的 `package.json`、`tsconfig*.json` 和构建配置
2. 根目录 `pnpm-workspace.yaml`、`turbo.json`、`.oxlintrc.json`、
   `.oxfmtrc.json`
3. 本文件

不要根据旧 README、已有 `dist/` 或 `.next/` 产物推断当前行为。

## 仓库概览

这是一个由 **pnpm workspace + Turborepo** 管理的 TypeScript monorepo。

- Node.js：根项目要求 `>=20`
- 包管理器：`pnpm@10.17.0`
- 主要运行时：React 19
- 构建编排：Turborepo 2
- 代码检查：Oxlint
- 格式化：Oxfmt
- 库构建：主要使用 Tsdown
- 测试：主要使用 Vitest，各包独立配置

依赖版本应优先复用 `pnpm-workspace.yaml` 中的 `catalog` / `catalogs`；
内部包依赖使用 `workspace:*`、`workspace:^` 等 workspace 协议。不要为同一依赖
在子包中随意引入新的独立版本。

## 工作区结构

```text
apps/
  web-h5/             Next.js 16 客户端门户，App Router
  web-admin/          Vite 管理后台，React Router + Tailwind CSS 4
  hr-pc-manager/      HR 桌面端，包名为 hr-admin，Tailwind CSS 3
  hr_mobile_manager/  HR 移动端，包名为 hr-mobile-manager，Tailwind CSS 3
  hr-system-admin/    新一代 HR 管理后台，TanStack Router + Ant Design + UnoCSS

packages/
  core/               核心能力、基础类型、请求、状态、工具和脚本
  shared/             跨 UI 实现共享的 token 与类型
  primitives/         可跨 UI 体系复用的基础原语
  web/                浏览器/React 管理后台专用包
  ui/                  旧版 @go-tech-frontend/ui 组件库
  styles/              旧版共享样式
  three/               Three.js 能力
  lib/                 已废弃的兼容入口

internal/
  config/              Oxlint、Vitest 等共享工程配置
  tsconfig/            共享 TypeScript 配置
  uno-config/          HR 管理后台 UnoCSS 配置
```

`apps/server/` 当前没有 `package.json`，不是可运行的 workspace 包。除非任务明确
要求恢复它，否则不要把它当作现有后端应用，也不要为它补造命令或架构说明。

## 应用技术约束

### `apps/web-h5`

- Next.js 16 App Router、React 19、Tailwind CSS 4。
- 使用 `next-intl`、Jotai、Drizzle ORM、MySQL 和服务端认证能力。
- `@/*` 指向应用根目录，而不是 `src/`。
- 默认开发端口为 `3001`；`start` 端口为 `3200`。
- 严格区分 Server Component、Client Component、Route Handler 和普通共享模块。
- 只有真正需要状态、Effect、事件或浏览器 API 的组件才添加 `"use client"`。
- `cookies()`、数据库、密钥、服务端 token 和 `server-only` 模块不得进入客户端依赖图。
- 浏览器可见环境变量使用 `NEXT_PUBLIC_*`；敏感变量不得添加该前缀。

### `apps/web-admin`

- Vite、React 19、React Router、TanStack Query、Tailwind CSS 4。
- 同时使用 `@go-tech-frontend/ui` 与 Ant Design；修改页面时延续所在功能区的
  既有 UI 体系，不要无理由混用两套组件风格。
- 启用了 React Compiler、PWA 和 GLSL 插件。
- `@/*` 指向 `src/*`，`~/*` 指向应用根目录。
- Vite 环境变量使用 `VITE_*`。

### `apps/hr-pc-manager` 与 `apps/hr_mobile_manager`

- Vite + React，使用 Tailwind CSS 3、Radix UI、React Hook Form、Zod 和
  TanStack Query。
- PC 端目录名是 `hr-pc-manager`，但 workspace 包名是 `hr-admin`。
- 移动端目录名含下划线，workspace 包名是 `hr-mobile-manager`。
- PC 开发端口为 `5175`，移动端开发端口为 `5174`。
- 两个应用的 TypeScript 配置相对宽松；新增代码仍应提供明确类型，不要因为
  `strict: false` 引入新的隐式 `any`。

### `apps/hr-system-admin`

- Vite + React 19、TanStack Router、TanStack Query、Jotai、Ant Design 6、
  UnoCSS 和 Sass。
- 开发服务端口为 `9528`。
- Vite 能力由 `@go-tech/web-admin-vite` 提供；变更构建行为时优先修改共享包，
  仅将应用特例留在本应用配置中。
- `routeTree.gen.ts` 是生成文件，不要手工编辑。

## 包分层与依赖边界

### 核心与平台无关入口

`packages/core/*` 包含 `@go-tech/utils`、`@go-tech/hooks`、
`@go-tech/core-http`、`@go-tech/axios`、`@go-tech/service`、
`@go-tech/core-state`、`@go-tech/logger`、`@go-tech/scheduler`、
`@go-tech/color`、`@go-tech/type-utils`、`@go-tech/types` 和
`@go-tech/scripts`。

- 被声明为 platform-neutral 的入口不得直接依赖 DOM、Next.js 或应用代码。
- `@go-tech/utils` 和 `@go-tech/hooks` 的根入口保持平台无关；浏览器能力分别从
  `@go-tech/utils/web`、`@go-tech/hooks/web` 导入。
- `@go-tech/core-http` 是可注入 adapter 的 fetch 内核；token、base URL、
  cookie 和 UI 错误提示属于应用 adapter，不属于内核。
- `@go-tech/types` 只放共享类型，不放运行时逻辑或平台 API。
- `@go-tech/scripts` 是 Node.js 工具包，可以使用 Node API，但不得被浏览器运行时
  代码依赖。
- 不要把 `packages/core` 目录名理解为所有包都绝对无 DOM；以各包导出、描述和
  TypeScript 配置为准。

继承 `@go-tech/tsconfig/library.json` 的包只有 `ESNext` lib，没有 DOM 类型。
遇到 `window`、`document`、`HTMLElement` 等类型错误时，应调整模块边界或增加明确
的 Web 子入口，不能通过给平台无关配置全局添加 DOM 来绕过。

### Shared、primitives 与 Web 包

- `packages/shared/ui-tokens`：零运行时依赖的设计 token。
- `packages/shared/ui-types`：跨 UI 实现共享的类型。
- `packages/primitives/filed-form`：包名为 `@go-tech/form`；目录中的 `filed`
  是现有命名，不要在任务外顺手重命名。
- `packages/web/*`：浏览器、React 或管理后台专用能力，可依赖 DOM。
- React 组件库应把 React、React DOM 等宿主依赖保持为 peer dependency，并在
  Tsdown 中 external，避免应用出现多份 React。
- 跨包导入使用公开包名和 `exports`，不要用 `../../packages/.../src` 穿透源码。
- 新增公共 API 时同步维护入口导出、`package.json#exports`、类型声明和测试。

### 旧版包

- `@go-tech-frontend/lib` 已废弃，只用于兼容旧代码。新代码直接使用
  `@go-tech/utils` 和 `@go-tech/hooks`。
- `@go-tech-frontend/ui`、`styles`、`three` 仍被现有应用使用，不能在未迁移调用方
  的情况下删除。
- 新功能应优先选择当前应用已经采用的包体系；不要仅为“统一”而进行跨应用大规模
  UI 迁移。

## TypeScript 与 React 约定

- 共享 TypeScript 基础配置位于 `internal/tsconfig/`。
- `base.json` 默认开启严格检查、`noUnusedLocals`、`noUnusedParameters`、
  `isolatedModules` 和 `verbatimModuleSyntax`。
- 纯类型导入使用 `import type`；不要依赖类型导入产生运行时副作用。
- 避免 `any`、非空断言和无边界类型断言；在 HTTP、存储和第三方数据入口处做
  校验或收窄。
- 保持组件和工具文件为 kebab-case，延续所在目录的导出方式。
- 除非存在明确性能问题，不要主动添加 `useMemo` 或 `useCallback`。React Compiler
  已覆盖部分应用；优先保证逻辑清晰和依赖正确。
- Hook 必须遵循调用顺序规则；Effect 中订阅、定时器和请求应正确清理。
- 不要通过复制公共实现解决跨应用复用问题；先判断它属于 core、shared、
  primitives、web 还是应用本地能力。

## 样式与 UI 约定

- 不要假设全仓库使用同一 CSS 方案：Web 应用主要为 Tailwind CSS 4，旧 HR 应用
  为 Tailwind CSS 3，`hr-system-admin` 主要为 UnoCSS + Sass + Ant Design。
- 修改共享组件时验证所有实际消费方，尤其注意 Tailwind 3/4、React 解析和主题
  token 差异。
- 复用已有 token、CVA variant 和组件 API；避免在页面中散落重复颜色与间距常量。
- 保持可访问性：使用语义化元素，交互控件支持键盘操作，表单有标签，图标按钮有
  可访问名称。

## 常用命令

从仓库根目录运行：

```bash
pnpm install

pnpm dev                 # turbo 启动所有声明 dev 的 workspace
pnpm build               # turbo 按依赖图构建
pnpm type-check          # 只运行名称精确为 type-check 的脚本
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
```

根 `package.json` 虽然定义了 `start:hr-m` 和 `start:hr-admin`，但对应应用目前没有
`start` 脚本，因此不要把这两个快捷命令当作可用命令；如需预览 Vite 产物，使用
目标包实际提供的 `preview` 脚本。

`hr-system-admin` 没有根快捷命令，按包名过滤：

```bash
pnpm --filter hr-system-admin dev
pnpm --filter hr-system-admin build
pnpm --filter hr-system-admin typecheck
```

包级检查示例：

```bash
pnpm --filter @go-tech/utils typecheck
pnpm --filter @go-tech/service test
pnpm --filter @go-tech/web-admin-layouts build
```

注意：仓库同时存在 `type-check` 与 `typecheck` 两种脚本名。根命令
`pnpm type-check` 对应 Turbo 的 `type-check` 任务，不会自动执行仅声明
`typecheck` 的包。验证改动时应读取目标包的 `package.json` 并运行它实际声明的
脚本，不能把根 `type-check` 成功表述为全仓库所有包均已通过类型检查。

## 修改与验证流程

1. 先确认目标应用/包及其 `package.json`、入口和消费方。
2. 保持改动集中，不修改任务无关的已有用户改动。
3. 优先运行目标 workspace 的类型检查和测试，再按影响范围运行构建。
4. 修改共享包时至少验证该包以及直接受影响的应用。
5. 只格式化本次涉及的文件；不要为了格式化制造全仓库无关 diff。

最低验证建议：

- 文档或配置：运行相关配置检查或 `pnpm format:check`。
- 应用代码：目标应用 type check + build；有相关测试时运行测试。
- 共享包：包级 typecheck/test/build + 至少一个真实消费方的 type check/build。
- HTTP、认证、数据库迁移、路由生成和构建配置属于高风险变更，应增加针对性验证。

不要编辑或提交 `node_modules/`、`dist/`、`.next/`、`.turbo/`、`coverage/` 等生成
产物。不要提交 `.env*` 中的密钥、token、证书或真实生产配置。

## 代码风格与提交

Oxfmt 是格式事实来源。当前关键规则包括：

- 单引号
- 分号
- 2 空格缩进
- 120 字符行宽
- 无尾随逗号
- 自动排序 import 与 `package.json`

不要按旧 Prettier 规则手工改回双引号、80 字符或 ES5 trailing comma。

提交信息使用：

```text
<type>(<scope>): <description>
```

常用类型为 `feat`、`fix`、`refactor`、`chore`、`docs`、`test`。只有用户明确要求
时才创建提交或推送远端。
