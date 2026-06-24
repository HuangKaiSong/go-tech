import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
// @ts-expect-error -- index.css is a Vite side-effect import handled at build time, no type declaration
// oxlint-disable-next-line import/no-unassigned-import
import './index.css';

if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      // oxlint-disable-next-line eslint/no-alert -- native confirm is acceptable for the PWA update prompt
      const shouldReload = window.confirm('检测到新版本，是否立即刷新页面？');
      if (shouldReload) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.info('应用已缓存，可离线访问');
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
