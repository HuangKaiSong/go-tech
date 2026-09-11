# @go-tech/package-ui

web-h5 套餐展示与 web-admin 即时预览共用的 React 组件。卡片结构、价格格式、计费文案、容量说明和功能展示规则只在这个包内维护。

```tsx
import { PackageCard } from '@go-tech/package-ui';
import type { PackageCardPlan } from '@go-tech/package-ui/model';

const plan: PackageCardPlan = { packageName: '基礎套餐', price: 100, count: 50 };

<PackageCard plan={plan} product="pms" />;
<PackageCard plan={plan} product="hr" preview />;
```

在 web-h5 的 `app/globals.css` 和 web-admin 的 `src/index.css` 中，沿用 workspace 的显式扫描方式，让 Tailwind CSS 4 生成共享组件的样式：

```css
@source '../../../packages/web/package-ui/src/**/*.{ts,tsx}';
```

路径相对于各应用的 CSS 文件。共享包只提供组件源码，无需额外导入 CSS 包入口。包复用宿主应用的主题 token；HR 卡片按容器宽度自动切换横排/竖排。

- `plan` 接收统一展示数据，接口字段的转换留在应用内。
- `TextComponent` 可注入 `{ text: string }` 组件，web-h5 使用 `DynamicText`。
- `LinkComponent` 可注入接收 `href`、`children`、`className` 的组件，web-h5 使用自己的 `Link` 保留路由与语言行为。
- `preview` 保留相同展示，禁用方案跳转，避免后台编辑时触发购买流程。
- `@go-tech/package-ui/model` 是纯数据入口，不加载 React 组件、路由或应用上下文。

本 workspace 通过公开 `exports` 直接消费源码，开发时修改会进入两端的热更新。独立部署的应用仍需分别重新构建、发布。

验证命令：`pnpm --filter @go-tech/package-ui typecheck`、`test`、`build`。
