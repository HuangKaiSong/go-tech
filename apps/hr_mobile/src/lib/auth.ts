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
