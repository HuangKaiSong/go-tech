import { createAlova } from 'alova';
import ReactHook from 'alova/react'
import adapterFetch from 'alova/fetch';
import { createClientTokenAuthentication } from 'alova/client'
import { getServiceBaseURL } from "@/utils/service";
import { getToken } from '@/hooks/use-auth';
// import { setAuth } from '@/hooks/use-auth';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication({
  visitorMeta: {
    // 设置忽略标识,
    isVisitor: true
  },
  login(response) {
    // oxlint-disable-next-line no-warning-comments
    // todo 设置登录态
    console.log(response);

    // setAuth(response.token)
  },
  assignToken: method => {
    // header 附加认证信息
    method.config.headers.Authorization = getToken()
  },
})

const alovaInstance = createAlova({
  baseURL,
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  beforeRequest: onAuthRequired(_method => {
    // 请求拦截器
  }),
  responded: onResponseRefreshToken((originalResponded) => {
    console.log(originalResponded);

    return originalResponded
  })
})

// 其他后端服务（demo）实例，baseURL 取自 getServiceBaseURL 返回的 otherBaseURL
const demoAlovaInstance = createAlova({
  baseURL: otherBaseURL.demo,
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  beforeRequest: onAuthRequired(_method => {
    // 请求拦截器
  }),
  responded: onResponseRefreshToken((originalResponded) => originalResponded)
})

export const request = alovaInstance

export const demoRequest = demoAlovaInstance

export default alovaInstance
