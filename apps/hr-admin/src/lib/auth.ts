/** 登录 token 与当前用户信息存取（localStorage） */

const TOKEN_KEY = "hr_token";
const USER_KEY = "hr_user";
const ROUTES_KEY = "hr_routes";
const PERMS_KEY = "hr_perms";

/** 当前登录用户（登录接口返回，前端缓存，避免再调单独的当前用户接口） */
export interface AuthUser {
  userId: number;
  userName: string;
  employeeNo?: string;
}

/** 存入完整 Authorization 值（tokenHead + token，例如 "Bearer xxx"） */
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  // 登出/失效時一併清除緩存的用戶信息、菜單路由與權限碼
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROUTES_KEY);
  localStorage.removeItem(PERMS_KEY);
}

/**
 * 存入登入返回的可存取菜單路由(path)集合，供側邊欄過濾。
 * 傳 undefined 表示後端未返回（舊 session）——不寫入，讀取時回退為 null（放行全部）。
 */
export function setRoutes(routes?: string[]) {
  if (routes == null) return;
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
}

/**
 * 取當前用戶可存取的菜單路由集合。
 * 返回 null 表示「未提供」→ 側邊欄放行全部（兼容舊 session / 未接權限的後端）；
 * 返回數組（含空數組）表示「已按權限過濾」→ 僅顯示命中的菜單。
 */
export function getRoutes(): string[] | null {
  const raw = localStorage.getItem(ROUTES_KEY);
  if (raw == null) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/**
 * 存入登入返回的權限碼集合（hr_menu.perms，含頁簽/操作按鈕權限點）。
 * 傳 undefined 表示後端未返回（舊 session / 未接權限）——不寫入，讀取時回退為 null（放行全部）。
 */
export function setPerms(perms?: string[]) {
  if (perms == null) return;
  localStorage.setItem(PERMS_KEY, JSON.stringify(perms));
}

/**
 * 取當前用戶權限碼集合。
 * 返回 null 表示「未提供」→ 放行全部（兼容舊 session / 未接權限的後端）；
 * 返回數組（含空數組）表示「已按職位過濾」→ 僅命中的權限碼放行。
 */
export function getPerms(): string[] | null {
  const raw = localStorage.getItem(PERMS_KEY);
  if (raw == null) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/**
 * 判斷當前用戶是否擁有某權限碼。
 * 未提供權限集合（null）時一律放行，保證未接權限的後端 / 舊 session 功能不受影響。
 */
export function hasPerm(code: string): boolean {
  const perms = getPerms();
  if (perms == null) return true;
  return perms.includes(code);
}

/**
 * 判斷當前用戶是否可存取某菜單路由（前綴匹配，用於儀表板卡片級門控）。
 * 未提供路由集合（null）時一律放行，語義與 hasPerm 一致。
 */
export function hasRoute(prefix: string): boolean {
  const routes = getRoutes();
  if (routes == null) return true;
  return routes.some((r) => r === prefix || r.startsWith(prefix));
}

export function setUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
