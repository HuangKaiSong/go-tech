import axios from "axios";
import i18n from "i18next";
import { getToken, clearToken } from "./auth";
import { translateDynamic } from "../i18n/backendDynamic";

/**
 * 後端返回的提示文案（繁體）過一遍 i18n：
 * - en：命中 en.json 的後端消息鍵則譯為英文；未命中靜態鍵時再試動態拼接模板
 *   （backendDynamic），仍未命中才回退繁體原文；
 * - zh-Hans：由 opencc 後處理器轉簡體（順帶統一後端繁簡混用的消息，含動態消息整串轉換）；
 * - zh-Hant：原樣。
 */
const tMsg = (msg?: string, fallback = "請求失敗") => {
  const raw = msg || fallback;
  const direct = i18n.t(raw);
  // en 下若未命中靜態鍵（t 原樣返回 key），再試後端動態拼接模板。
  if (i18n.language === "en" && direct === raw) {
    return translateDynamic(raw) ?? direct;
  }
  return direct;
};

const request = axios.create({
  baseURL: "/hr-manage",
  timeout: 10000,
});

// 请求拦截器：自动带上登录 token
request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    // 攔截器拿到的是 InternalAxiosRequestConfig，headers 必定存在（AxiosHeaders 實例），直接賦值。
    config.headers.Authorization = token;
  }
  return config;
});

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 文件下载（blob）：不做 code 校验，直接返回完整响应供调用方处理
    if (response.config.responseType === "blob") {
      return response;
    }
    const res = response.data;
    // 未登录 / token 失效：清除并跳转登录页
    if (res.code === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(new Error(tMsg(res.message, "未登入或登入已過期")));
    }
    if (res.code !== 200) {
      console.error("接口错误:", res.message);
      return Promise.reject(new Error(tMsg(res.message)));
    }
    return res;
  },
  (error) => {
    // 后端业务异常（如 400 用户名或密码错误）会把提示放在响应体的 message 里
    const data = error.response?.data;
    if (data?.code === 401 || error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(new Error(tMsg(data?.message, "未登入或登入已過期")));
    }
    const rawMsg = data?.message || error.message || "請求失敗";
    console.error("接口错误:", rawMsg);
    return Promise.reject(new Error(tMsg(rawMsg)));
  }
);

export default request;
