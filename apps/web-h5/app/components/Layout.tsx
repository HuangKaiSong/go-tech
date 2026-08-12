'use client';

import { JotaiProvider } from '@go-tech/core-state';
import { Suspense, useEffect, useState } from 'react';
import { IframeProvider } from '@/contexts/IframeContext';
import { WhatsappService } from './CustomerService';
import { NavigationProgress } from './navigation-progress';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [hasIframe, setHasIframe] = useState<boolean>(false);

  useEffect(() => {
    // 判断是否有 iframe 嵌套, 如果有, 路由功能不可用, 按钮不可用
    if (window.parent !== window) {
      setHasIframe(true);
    }
  }, []);

  return (
    <JotaiProvider>
      <IframeProvider hasIframe={hasIframe}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <div className="bg-white dark:bg-gray-950 text-black dark:text-white antialiased" data-iframe={hasIframe}>
          {/* <Toaster theme="system" className="toaster group" position="top-right" richColors /> */}
          {children}
          <WhatsappService />
        </div>
      </IframeProvider>
    </JotaiProvider>
  );
}
