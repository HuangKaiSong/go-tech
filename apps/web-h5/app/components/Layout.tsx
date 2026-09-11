'use client';

import { JotaiProvider } from '@go-tech/core-state';
import { useSyncExternalStore } from 'react';
import { IframeProvider } from '@/contexts/IframeContext';
import { TrialWindowProvider } from '@/contexts/TrialWindowContext';
import { WhatsappService } from './CustomerService';

const subscribeToIframeState = () => () => {};
const getIframeSnapshot = () => window.parent !== window;
const getServerIframeSnapshot = () => false;

export default function Layout({ children }: { children: React.ReactNode }) {
  const hasIframe = useSyncExternalStore(subscribeToIframeState, getIframeSnapshot, getServerIframeSnapshot);

  return (
    <TrialWindowProvider>
      <JotaiProvider>
        <IframeProvider hasIframe={hasIframe}>
          <div className="bg-white dark:bg-gray-950 text-black dark:text-white antialiased" data-iframe={hasIframe}>
            {/* <Toaster theme="system" className="toaster group" position="top-right" richColors /> */}
            {children}
            <WhatsappService />
          </div>
        </IframeProvider>
      </JotaiProvider>
    </TrialWindowProvider>
  );
}
