import request from "@/lib/request";

/** 统一返回结构 */
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

/** 登录返回（含当前登录用户信息 + 可访问菜单路由） */
export interface LoginResult {
  token: string;
  tokenHead: string;
  userId: number;
  userName: string;
  employeeNo?: string;
  routes?: string[];
}

/** 员工登录（手机号 + 密码），与 PC 端共用同一后端接口 */
export function login(data: { phone: string; password: string }) {
  return request.post<any, ApiResult<LoginResult>>("employee/login", data);
}
