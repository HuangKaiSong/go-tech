import { defineConfig, loadEnv } from 'vite'
import { resolve } from "path";
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode,  }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_PROXY_PREFIX, VITE_PROXY_TARGET } = env

  return {
    plugins: [react({
      babel: {
        plugins: [
          "babel-plugin-react-compiler"
        ]
      }
    })],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        [VITE_PROXY_PREFIX]: {
          target: VITE_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${VITE_PROXY_PREFIX}`), ''),
        },
      }
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

        },
      },
    },
  }
})
