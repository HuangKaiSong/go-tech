# 阶段 0 — 工程化地基（已落地）

本阶段只动工程化基础设施，**未改任何业务代码**。引入 Turborepo + oxlint/oxfmt（完全替换 ESLint/Prettier）+ 共享 tsconfig。

> ⚠️ 沙箱内 npm registry 被禁，无法联网安装与运行，因此以下改动**未在本机验证**。请在你的机器上按「验证步骤」执行一次。

## 改了什么

**新增**

- `turbo.json` — 定义 `dev` / `build` / `lint` / `type-check` / `preview` 任务，`build` 配 `dependsOn: ["^build"]` 与产物缓存（`.next`、`dist`、`build`）。
- `.oxlintrc.json` — oxlint 配置：启用 `react`(含 hooks 规则)、`typescript`、`import`、`jsx-a11y`、`nextjs` 插件；保留你原来的宽松规则（`no-unused-vars`、`no-explicit-any` 关）。
- `.oxfmtrc.json` — oxfmt 配置（默认即 prettier 兼容风格）。
- `internal/tsconfig/`（`@go-tech/tsconfig`）— 共享 TS 基础配置：`base.json`（平台无关）、`vite-react.json`（Web 应用，继承 base）。

**修改**

- 根 `package.json` — 脚本改走 Turbo/oxlint/oxfmt；新增 devDeps `turbo@^2.7.1`、`oxlint@^1.60.0`、`oxfmt@^0.45.0`。原有 `--filter` 快捷脚本保留。
- 各 app `package.json` — `lint` 改为 `oxlint`，新增 `type-check`；移除 ESLint/Prettier 相关 devDeps；新增 `@go-tech/tsconfig: workspace:*`。
- 各 app `tsconfig` — `extends` 共享配置（HR 两个应用收敛到 `vite-react.json`，web-admin/web-h5 继承并保留各自覆盖项）。
- `pnpm-workspace.yaml` — `packages` 增加 `internal/*`；移除已无引用的 ESLint catalog 条目。

**删除**

- 4 个 `eslint.config.*`、根 `.prettierrc`。

## 验证步骤（在本机执行）

```bash
pnpm install                 # 拉取 turbo / oxlint / oxfmt，链接 @go-tech/tsconfig
pnpm lint                    # oxlint 全量
pnpm format:check            # oxfmt 校验（首次可先 pnpm format 再提交）
pnpm type-check              # turbo 编排各 app 类型检查
pnpm build                   # 验证 Turbo 构建与缓存（再跑一次应命中缓存）
```

## 需注意 / 可能需微调

1. **oxfmt CLI 标志**：`format`/`format:check` 用的是 `oxfmt .` / `oxfmt --check .`。oxfmt 较新，若你装到的版本标志不同（如 `-c`），按 `oxfmt --help` 调整这两条脚本即可。
2. **首次 oxfmt 会重排格式**：建议先 `pnpm format` 跑一遍并单独提交「格式化」commit，后续 `format:check` 才会干净。
3. **oxlint 报错量**：oxlint 的 `correctness` 类是 error。首次可能暴露一些此前 ESLint 没拦的问题。若需先跑通 CI，可临时把 `.oxlintrc.json` 的 `categories.correctness` 调为 `warn`，逐步清零后再调回 `error`。
4. **react-hooks 校验**：已由 oxlint `react` 插件接管（`rules-of-hooks`、`exhaustive-deps`）。若发现覆盖不足，可在阶段 0 内临时保留 ESLint 仅跑该规则——但你已选择「完全替换」，默认不保留。
5. **Next.js 构建**：web-h5 移除了 `eslint-config-next`，`next build` 不再内置 lint（改由 `pnpm lint` 统一）。功能不受影响。
6. **catalog 清理**：仅移除了纯 ESLint 条目；其余 catalog 不动。

## 下一步（已确认、后续阶段执行）

- 阶段 1：抽取 `packages/core/*`（命名空间统一为 **`@go-tech/*`**）。
- 阶段 2：HR 两应用 49×2 个 UI 组件收敛到共享包，**用参数化（CVA variant/props）兼容定制**。
- 阶段 3：共享 service 层 + **引入 Jotai** 对齐 skyroc。
- 全程：`@go-tech-frontend/*` → `@go-tech/*` 改名。
