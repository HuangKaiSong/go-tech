# @go-tech/web-admin-styles

Shared global CSS assets for Skyroc admin web applications.

```ts
import '@go-tech/web-admin-styles/global.css';
```

## Exports

| Export | Purpose |
| --- | --- |
| `@go-tech/web-admin-styles/global.css` | Admin app global style entry. Includes reset and NProgress styles. |
| `@go-tech/web-admin-styles/reset.css` | Browser reset and base element normalization. |
| `@go-tech/web-admin-styles/nprogress.css` | NProgress bar and spinner styles. |

The package only owns CSS assets. Runtime setup such as `setupNProgress()` stays in `@go-tech/web-admin-runtime`, and the host app should import these styles explicitly from its asset entry.
