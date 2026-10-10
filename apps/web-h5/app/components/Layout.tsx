'use client';

import { JotaiProvider } from '@go-tech/core-state';
import { useSyncExternalStore } from 'react';
import { IframeProvider } from '@/contexts/IframeContext';
import { TrialWindowProvider } from '@/contexts/TrialWindowContext';
import { ViewModeProvider } from '@/contexts/view-mode-context';
import type { ViewMode } from '@/lib/view-mode';
import { WhatsappService } from './CustomerService';
import MobileNav from './MobileNav';
import ViewModeShell from './ViewModeShell';

const subscribeToIframeState = () => () => {};
const getIframeSnapshot = () => window.parent !== window;
const getServerIframeSnapshot = () => false;

export default function Layout({
  children,
  initialViewMode
}: {
  children: React.ReactNode;
  initialViewMode?: ViewMode;
}) {
  const hasIframe = useSyncExternalStore(subscribeToIframeState, getIframeSnapshot, getServerIframeSnapshot);

  return (
    <TrialWindowProvider>
      <JotaiProvider>
        <IframeProvider hasIframe={hasIframe}>
          <ViewModeProvider initialMode={initialViewMode}>
            <ViewModeShell
              controls={
                <>
                  <WhatsappService />
                  <MobileNav />
                </>
              }
            >
              <div className="bg-white dark:bg-gray-950 text-black dark:text-white antialiased" data-iframe={hasIframe}>
                {children}
              </div>
            </ViewModeShell>
          </ViewModeProvider>
        </IframeProvider>
      </JotaiProvider>
    </TrialWindowProvider>
  );
}
