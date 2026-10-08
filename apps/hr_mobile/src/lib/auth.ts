/** 登录 token 与当前用户信息存取（localStorage）——手机端 */

const TOKEN_KEY = "hr_token";
const USER_KEY = "hr_user";

/** 当前登录用户（登录接口返回，前端缓存） */
export interface AuthUser {
  employeeNo?: string;
  userId: number;
  userName: string;
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
  localStorage.removeItem(USER_KEY);
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
  return Boolean(getToken());
}

/**
 * 本地判断 Authorization 值（"Bearer xxx"）里的 JWT 是否已过期。
 * 解析失败/无 exp 时按「未过期」处理（交给后端判定），只在能确定过期时返回 true。
 */
export function isTokenExpired(authValue: string | null): boolean {
  if (!authValue) return false;
  const jwt = authValue.replace(/^Bearer\s+/i, "").trim();
  const parts = jwt.split(".");
  if (parts.length < 2) return false;
  try {
    // base64url → base64
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(b64)))) as { exp?: number };
    if (!payload.exp) return false;
    // exp 为秒；留 5 秒缓冲避免临界误差
    return payload.exp * 1000 <= Date.now() + 5000;
  } catch {
    return false;
  }
}
