import json5 from 'json5';

/**
 * 通过当前环境创建服务配置
 *
 * @param env The current env
 */
export function createServiceConfig(env: Env.ImportMeta) {
  const { VITE_OTHER_SERVICE_BASE_URL, VITE_SERVICE_BASE_URL } = env;

  let other = {} as Record<Api.Service.OtherBaseURLKey, string>;
  try {
    other = json5.parse(VITE_OTHER_SERVICE_BASE_URL);
  } catch {
    // eslint-disable-next-line no-console
    console.error('VITE_OTHER_SERVICE_BASE_URL is not a valid json5 string');
  }

  const httpConfig: Api.Service.SimpleServiceConfig = {
    baseURL: VITE_SERVICE_BASE_URL,
    other
  };

  const otherHttpKeys = Object.keys(httpConfig.other) as Api.Service.OtherBaseURLKey[];

  const otherConfig: Api.Service.OtherServiceConfigItem[] = otherHttpKeys.map(key => {
    return {
      baseURL: httpConfig.other[key],
      key,
      proxyPattern: createProxyPattern(key)
    };
  });

  const config: Api.Service.ServiceConfig = {
    baseURL: httpConfig.baseURL,
    other: otherConfig,
    proxyPattern: createProxyPattern()
  };

  return config;
}

/**
 * 获取后端服务地址
 *
 * @param env - The current env
 * @param isProxy - If use proxy
 */
export function getServiceBaseURL(env: Env.ImportMeta, isProxy: boolean) {
  const { baseURL, other } = createServiceConfig(env);

  const otherBaseURL = {} as Record<Api.Service.OtherBaseURLKey, string>;

  other.forEach(item => {
    otherBaseURL[item.key] = isProxy ? item.proxyPattern : item.baseURL;
  });

  return {
    baseURL: isProxy ? createProxyPattern() : baseURL,
    otherBaseURL
  };
}

/**
 * 获取后端服务基地址的代理模式
 *
 * @param key If not set, will use the default key
 */
export function createProxyPattern(key?: Api.Service.OtherBaseURLKey) {
  if (!key) {
    return '/proxy-default';
  }

  return `/proxy-${key}`;
}
