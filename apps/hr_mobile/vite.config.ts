import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
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
  }
}));
