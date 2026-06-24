import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => ({
  server: {
    host: '::',
    port: 5175,
    hmr: {
      overlay: false
    },
    proxy: {
      '/get-wifi-info': {
        target: 'http://192.168.0.1/webpages/login.html',
        changeOrigin: true,
        hostRewrite: '192.168.0.1',
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          Connection: 'keep-alive',
          Host: '192.168.0.1'
        },
        rewrite: _path => {
          const loca = _path.replace(/^\/get-wifi-info/, '');
          console.log(`http://192.168.0.1/webpages/login.html${loca}`);
          return loca;
        }
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}));
