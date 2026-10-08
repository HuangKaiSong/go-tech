import axios from "axios";
import { clearToken, getToken, isTokenExpired } from "./auth";

/** 手机端与 PC 端共用同一套后端；登录页为 "/"（不同于 PC 的 /login） */
const LOGIN_PATH = "/";

// oxlint-disable-next-line import/no-named-as-default-member
const request = axios.create({
  baseURL: "/hr-manage",
  timeout: 10000,
});

// 公开接口（登录/免密登录/忘记密码）：无需登录态，一律不带 Authorization，
// 避免切换版本后带着旧 token 请求登录，触发后端租户解析异常
const NO_AUTH = ["employee/login", "employee/loginByCode", "employee/password/forgot"];

// 请求拦截器：自动带上登录 token；本地已过期的 token 先清掉，避免带废 token 请求（含登录）
request.interceptors.request.use((config) => {
  if (NO_AUTH.some((u) => config.url?.includes(u))) {
    return config;
  }
  let token = getToken();
  if (token && isTokenExpired(token)) {
    clearToken();
    token = null;
  }
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = token;
  }
  return config;
});

/** 未登录 / token 失效：清除并跳转登录页 */
function redirectToLogin() {
  clearToken();
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
}

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response;
    }
    const res = response.data;
    if (res.code === 401) {
      redirectToLogin();
      return Promise.reject(new Error(res.message || "未登入或登入已過期"));
    }
    if (res.code !== 200) {
      console.error("接口错误:", res.message);
      return Promise.reject(new Error(res.message || "请求失败"));
    }
    return res;
  },
  (error) => {
    const data = error.response?.data;
    if (data?.code === 401 || error.response?.status === 401) {
      redirectToLogin();
      return Promise.reject(new Error(data?.message || "未登入或登入已過期"));
    }
    const msg = data?.message || error.message || "請求失敗";
    console.error("接口错误:", msg);
    return Promise.reject(new Error(msg));
  }
);

export default request;
