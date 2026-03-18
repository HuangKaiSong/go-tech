"use client";

import { IframeProvider } from "@/contexts/IframeContext";
import { useEffect, useState } from "react";
import { Toaster } from "@go-tech-frontend/ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [hasIframe, setHasIframe] = useState<boolean>(false);

  useEffect(() => {
    // 判断是否有 iframe 嵌套, 如果有, 路由功能不可用, 按钮不可用
    if (window.parent !== window) {
      setHasIframe(true);
    }
  }, []);

  return (
    <IframeProvider hasIframe={hasIframe}>
      <div
        className="bg-white dark:bg-gray-950 text-black dark:text-white antialiased"
        data-iframe={hasIframe}
      >
        <Toaster
          theme="system"
          className="toaster group"
          position="top-right"
          richColors
        />
        {children}
      </div>
    </IframeProvider>
  );
}
