import react from '@vitejs/plugin-react-swc';
import path, { resolve } from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: '::',
    port: 5174,
    hmr: {
      overlay: false
    },
    proxy: {
      // 手机端与 PC 端共用同一套后端(pms-hr)，接口前缀 /hr-manage 转发到本地后端
      '/hr-manage': {
        target: 'http://localhost:7079',
        changeOrigin: true
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, '', 'index.html')
      },
       output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          manualChunks: (moduleId) => {
            if (['react', 'react-dom'].includes(moduleId)) {
              return 'react'
            }
            if (['react-router-dom'].includes(moduleId)) {
              return 'router'
            }
            if (['@go-tech-frontend/ui'].includes(moduleId)) {
              return 'ui'
            }
            if (['lucide-react'].includes(moduleId)) {
              return 'icon'
            }
            return 'vendor'
          }
        }
    }
  }
}));
