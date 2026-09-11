'use client';

import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { startFreeTrial } from '@/app/lib/go-now';
import { useAuth } from './AuthContext';

type PmsWindowAction = 'order' | 'service-plan' | 'trial-env';

interface TrialWindowContextValue {
  openPmsCallback: (uri: string) => void;
}

const TrialWindowContext = createContext<TrialWindowContextValue | null>(null);

function resolveAction(value: unknown): PmsWindowAction | null {
  if (typeof value !== 'string') return null;

  const normalized = value.toLowerCase();
  if (normalized.includes('service-plan')) return 'service-plan';
  if (normalized.includes('trial-env')) return 'trial-env';
  if (normalized.includes('order')) return 'order';

  return null;
}

export function TrialWindowProvider({ children }: { children: ReactNode }) {
  const router = useProgressRouter();
  const { token } = useAuth();
  const pm2Window = useRef<Window | null>(null);

  const openPmsCallback = useCallback((uri: string) => {
    const trialHost = process.env.NEXT_PUBLIC_TRIAL_HOST;
    pm2Window.current = window.open(`${trialHost}/oauth/${uri}`, '_blank');
  }, []);

  const applyAction = useCallback(
    (action: PmsWindowAction) => {
      if (action === 'trial-env') {
        startFreeTrial({ generateCallback: openPmsCallback, token });
        return;
      }
      if (action === 'service-plan') {
        pm2Window.current = window.open('/service-plan', '_blank');
        router.replace('/service-plan');
        return;
      }

      pm2Window.current = window.open('/my-orders', '_blank');
      router.replace('/my-orders');
    },
    [openPmsCallback, router, token]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const action = resolveAction(event.data?.command ?? event.data?.action ?? event.data?.type);
      if (action) applyAction(action);
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const action = resolveAction(detail?.command ?? detail?.action ?? detail?.type);
      if (action) applyAction(action);
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('pm2Window', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('pm2Window', handleCustomEvent as EventListener);
    };
  }, [applyAction]);

  return <TrialWindowContext.Provider value={{ openPmsCallback }}>{children}</TrialWindowContext.Provider>;
}

export function useTrialWindow() {
  const context = useContext(TrialWindowContext);
  if (!context) throw new Error('useTrialWindow must be used inside TrialWindowProvider');

  return context;
}
