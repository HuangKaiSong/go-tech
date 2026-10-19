# 显示模式与命名容器

`Layout` 在同一页面树外提供 `ViewModeProvider` 和 `ViewModeShell`。模式切换不重新挂载业务页面，登录、表单及产品选择状态继续保留。`data-view-mode` 只表达选择；布局以 `@container/view` 的逻辑宽度为准。

## 布局与尺寸

命名容器为 `view`。`app/view-mode.css` 将现有 `sm / md / lg / xl / 2xl` 及 `max-*` 变体转换为此容器查询，沿用40/48/64/80/96rem断点。框外仍使用媒体查询。新增布局可以直接声明 `@container view (width >= 48rem)`，避免依赖浏览器真实宽度。

手机模式在≥1024px浏览器中居中430px；更窄时逻辑宽度为 `min(767px, 浏览器宽度)`，按比例填满浏览器。PC模式逻辑宽度至少1280px，窄屏缩放并从左侧起始。自动模式使用设备宽度。

高度使用 `--view-height`，它来自visualViewport并除以缩放比例。`h-screen / min-h-screen / h-dvh / min-h-dvh` 已适配；新增弹窗的最大高度也应使用该变量。固定控件放入Shell的controls层；Portal放入框内宿主。

## 模式状态与路由

`useViewMode()` 提供 `mode / setMode / frame / isMobile`。模式存入 `GO_TECH_VIEW_MODE` Cookie，服务端读取初始值；localStorage仅用于兼容旧偏好。无需修改meta viewport或创建iframe。

独立滚动区由Shell管理路径切换、hash与浏览器历史恢复。通用Link和useProgressRouter默认 `scroll:false`，避免Next的自动滚动覆盖Shell位置；同路径产品参数切换保留滚动。历史恢复等待异步内容撑开页面，并在用户操作时取消待恢复行为。

公共UI使用可选 `PortalContainerProvider`，Dialog/Sheet/Drawer/DropdownMenu/Select跟随宿主；没有Provider的消费方保留原行为。DropdownMenu和Select将frame作为碰撞边界。Sonner及导航进度也位于框内。

## 验证

生产 CSS 必须同时包含 `view-mode` 布局规则、命名容器变体和 `--whatsapp` 品牌色定义。缺少这些规则时，
WhatsApp 按钮会变透明，模式切换器会失去固定定位并落到页面底部。

应用 `build`、根目录 `build:h5` 和 PM2 使用的 standalone 启动入口都会运行
`scripts/check-build-css.cjs`，缺少关键规则时直接报错。根目录校验在 Turbo 之后执行，缓存命中时也不会跳过。
线上发布从仓库根目录执行 `pnpm build:h5`，成功后再执行
`pm2 restart ecosystem.config.cjs --only go-tech-next --update-env`。
发布后需确认 HTML 与 `/_next/static/` 来自同一次构建；若仍引用旧 CSS，应检查部署目录及反向代理/CDN 缓存。

```bash
pnpm --filter web-h5 test:view-mode
pnpm --filter web-h5 test
pnpm --filter web-h5 type-check
pnpm --filter web-h5 build
pnpm --filter web-admin type-check
pnpm --filter web-admin build
```

`test` 为既有node:test和Vitest分别选择运行器；不能把组件测试交给node:test。显示模式测试覆盖尺寸、缩放手势、Portal隔离、模式切换不重挂载及异步历史恢复。浏览器验收应同时检查真实App Router、登录后业务和小屏弹窗，触屏最终体验需补充真机验证。
