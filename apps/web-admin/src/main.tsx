import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      const shouldReload = window.confirm("检测到新版本，是否立即刷新页面？");
      if (shouldReload) {
        void updateSW(true);
      }
    },
    onOfflineReady() {
      console.info("应用已缓存，可离线访问");
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
