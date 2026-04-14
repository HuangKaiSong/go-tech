import react from '@vitejs/plugin-react';
import { resolve } from "path";
import { defineConfig, loadEnv } from 'vite';
import glsl from 'vite-plugin-glsl';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode, }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_PROXY_PREFIX, VITE_PROXY_TARGET, VITE_H5_SITE_URL } = env

  return {
    plugins: [
      glsl(),
      react({
        babel: { plugins: ['babel-plugin-react-compiler'] },
      }).map((p) => ({
        ...p,
        applyToEnvironment: (e) => e.name === 'client',
      })),
      VitePWA({
        injectRegister: 'auto',
        registerType: 'prompt',
        devOptions: { enabled: false },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'go-techs-admin-v1-api',
              },
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'go-techs-admin-v1-cdn',
              },
            },
          ],
        },
      })
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      proxy: {
        [VITE_PROXY_PREFIX]: {
          target: VITE_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${VITE_PROXY_PREFIX}`), ''),
        },
        '/h5-hook': {
          target: VITE_H5_SITE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/h5-hook/, ''),
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    css: {
      devSourcemap: false,
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, '', 'index.html')
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@go-tech-frontend/ui'],
            icon: ['lucide-react']
          },
        },
      },
    },
    define: {
      __DEV__: false,
    }
  }
})
