import process from 'node:process';

import type { HttpProxy, ProxyOptions } from 'vite';

type ViteProxy = Record<string, ProxyOptions>;

/**
 * 根据后端服务配置创建 Vite 开发服务器代理
 *
 * 抽取自 `@go-tech/admin-vite` 的 `createAdminViteProxy`，并适配移动端 HR 项目的
 * `Api.Service.ServiceConfig` 类型（去除了 kolorist 彩色日志依赖）。
 *
 * @param serviceConfig 由 `createServiceConfig` 生成的服务配置
 * @param enableLog 是否在终端打印代理地址与真实请求地址
 */
export function createViteProxy(serviceConfig: Api.Service.ServiceConfig, enableLog = false) {
  const proxy: ViteProxy = createProxyItem(serviceConfig, enableLog);

  serviceConfig.other.forEach(item => {
    Object.assign(proxy, createProxyItem(item, enableLog));
  });

  return proxy;
}

function createProxyItem(item: Api.Service.ServiceConfigItem, enableLog: boolean) {
  const proxy: ViteProxy = {};

  proxy[item.proxyPattern] = {
    changeOrigin: true,
    configure: (_proxy: HttpProxy.ProxyServer, options: ProxyOptions) => {
      _proxy.on('proxyReq', (_proxyReq, req) => {
        if (!enableLog) return;

        process.stdout.write(`[proxy] ${req.method} ${item.proxyPattern}${req.url} -> ${options.target}${req.url}\n`);
      });
      _proxy.on('error', (_err, req) => {
        if (!enableLog) return;

        process.stdout.write(`[proxy error] ${req.method} ${options.target}${req.url}\n`);
      });
    },
    rewrite: path => rewriteProxyPath(path, item.proxyPattern),
    target: item.baseURL
  };

  return proxy;
}

/** 去除请求路径中的代理前缀，还原真实后端路径 */
function rewriteProxyPath(path: string, proxyPattern: string) {
  if (!path.startsWith(proxyPattern)) return path;

  return path.slice(proxyPattern.length);
}
