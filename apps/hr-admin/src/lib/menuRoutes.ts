/** 菜单路由鉴权：把任意路径归属到其所属「菜单基路径」，再对照登录返回的授权集合。 */

import { getRoutes } from "./auth";

/** 落地页/公共页：无论是否授权都放行，避免登入后无处可去 */
export const ALWAYS_VISIBLE = ["/"];

/**
 * 所有「菜单基路径」——与 AppSidebar 叶子 url 一致，也应与 hr_menu 中 menu_type=1 的 path 对齐。
 * 明细/表单等子路由（如 /employees/:id、/organization/roles/new）不在此列，
 * 通过「最长前缀」归属到其所属菜单再鉴权。
 * 新增侧边栏菜单项时，请同步在此登记。
 */
export const ALL_MENU_PATHS = [
  "/",
  "/employees",
  "/employees/onboarding",
  "/employees/offboarding",
  "/organization/departments",
  "/organization/roles",
  "/organization/chart",
  "/attendance/clock-in",
  "/attendance/records",
  "/attendance/approval",
  "/payroll/structure",
  "/payroll/calculate",
  "/payroll/bonus-penalty",
  "/payroll/distribute",
  "/performance/plans",
  "/performance/evaluation",
  "/training/plans",
  "/training/records",
  "/notifications",
  "/reports",
  "/settings/menus",
  "/settings",
];

/**
 * 找当前路径归属的菜单基路径（最长的、按路径段匹配的前缀）。
 * 例：/employees/123 → /employees；/employees/onboarding/5 → /employees/onboarding。
 * 归属不到任何菜单（孤儿路由）返回 null。
 */
export function resolveMenuBase(pathname: string): string | null {
  if (pathname === "/") return "/";
  let best: string | null = null;
  for (const base of ALL_MENU_PATHS) {
    if (base === "/") continue; // "/" 只精确匹配，不作万能前缀
    if (pathname === base || pathname.startsWith(base + "/")) {
      if (best == null || base.length > best.length) best = base;
    }
  }
  return best;
}

/**
 * 判断当前路径是否被当前登录用户授权访问。
 * - getRoutes() 为 null → 放行（旧 session / 后端未接权限，避免误伤）
 * - 命中 ALWAYS_VISIBLE → 放行
 * - 能归属到某菜单基路径 → 该基路径需在授权集合内
 * - 归属不到任何菜单（孤儿路由）→ 放行，交由页面自身或 NotFound 处理
 */
export function isRouteAllowed(pathname: string): boolean {
  const routes = getRoutes();
  if (routes == null) return true;
  if (ALWAYS_VISIBLE.includes(pathname)) return true;
  const base = resolveMenuBase(pathname);
  if (base == null) return true;
  if (ALWAYS_VISIBLE.includes(base)) return true;
  return routes.includes(base);
}
