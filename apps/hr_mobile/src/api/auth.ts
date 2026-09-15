import request from "@/lib/request";

/** 统一返回结构 */
export interface ApiResult<T> {
  code: number;
  data: T;
  message: string;
}

/** 登录返回（含当前登录用户信息 + 可访问菜单路由） */
export interface LoginResult {
  employeeNo?: string;
  routes?: string[];
  token: string;
  tokenHead: string;
  userId: number;
  userName: string;
}

/** 员工登录（手机号 + 密码），与 PC 端共用同一后端接口 */
export function login(data: { password: string; phone: string }) {
  return request.post<any, ApiResult<LoginResult>>("employee/login", data);
}

/** 当前登录员工修改密码（校验原密码后写入新密码） */
export function changePassword(data: { newPassword: string; oldPassword: string }) {
  return request.post<any, ApiResult<boolean>>("employee/changePassword", data);
}

/** 忘记密码-发送邮箱验证码 */
export function sendResetCode(data: { email: string }) {
  return request.post<any, ApiResult<boolean>>("employee/password/forgot/send", data);
}

/** 忘记密码-校验验证码并重置密码 */
export function resetPassword(data: { code: string; email: string; newPassword: string }) {
  return request.post<any, ApiResult<boolean>>("employee/password/forgot/reset", data);
}
