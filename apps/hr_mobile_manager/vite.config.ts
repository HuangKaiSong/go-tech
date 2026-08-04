import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import { createServiceConfig } from './src/utils/service';
import { createViteProxy } from './src/utils/proxy';

// https://vitejs.dev/config/
export default defineConfig(async configEnv => {
  const root = process.cwd();
  const env = loadEnv(configEnv.mode, root) as unknown as Env.ImportMeta;

  const serviceConfig = createServiceConfig(env);

  // 仅在开发服务器（非 preview）且开启 http 代理开关时启用代理
  const enableProxy = configEnv.command === 'serve' && !configEnv.isPreview && env.VITE_HTTP_PROXY === 'Y';
  const enableProxyLog = env.VITE_PROXY_LOG === 'Y';

  return {
    server: {
      host: '::',
      port: 5174,
      hmr: {
        overlay: false
      },
      proxy: enableProxy ? createViteProxy(serviceConfig, enableProxyLog) : undefined
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src')
      }
    }
  };
});
