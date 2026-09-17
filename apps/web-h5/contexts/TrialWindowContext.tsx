'use client';

import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { startFreeTrial } from '@/app/lib/go-now';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { useAuth } from './AuthContext';

type PmsWindowAction = 'order' | 'renew' | 'service-plan' | 'trial-env';

interface TrialWindowContextValue {
  openPmsCallback: (uri: string) => void;
}

const TrialWindowContext = createContext<TrialWindowContextValue | null>(null);

function resolveAction(value: unknown): PmsWindowAction | null {
  if (typeof value !== 'string') return null;

  const normalized = value.toLowerCase();
  if (normalized.includes('service-plan')) return 'service-plan';
  if (normalized.includes('trial-env')) return 'trial-env';
  if (normalized.includes('renew')) return 'renew';
  if (normalized.includes('order')) return 'order';

  return null;
}

function resolveOrderId(value: unknown): string | null {
  const orderId = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;
  return typeof orderId === 'number' && Number.isSafeInteger(orderId) && orderId > 0 ? String(orderId) : null;
}

export function TrialWindowProvider({ children }: { children: ReactNode }) {
  const router = useProgressRouter();
  const { token } = useAuth();
  const pm2Window = useRef<Window | null>(null);

  const requestHeaders = useCallback(
    () =>
      new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Type': 'platform_customer'
      }),
    [token]
  );

  const openPmsCallback = useCallback((uri: string) => {
    const trialHost = process.env.NEXT_PUBLIC_PMS_TRIAL_HOST;
    pm2Window.current = window.open(`${trialHost}/oauth/${uri}`, '_blank');
  }, []);

  const applyAction = useCallback(
    async (action: PmsWindowAction, data?: unknown) => {
      if (action === 'trial-env') {
        startFreeTrial({
          generateCallback: openPmsCallback,
          onTrialExpired: () => router.push('/service-plan'),
          token
        });
        return;
      }
      if (action === 'service-plan') {
        pm2Window.current = window.open('/service-plan', '_blank');
        router.replace('/service-plan');
        return;
      }
      if (action === 'renew') {
        const tanId = data;
        const headers = requestHeaders();

        const response = await clientFetch(
          `/go-tech/platform/packageOrder/relateOrderId?tenantId=${tanId}`,
          {
            headers
          },
          { feedback: 'silent' }
        );
        const result = await response.json();
        if (result.code !== 200) throw new Error('123');
        const orderId = resolveOrderId(result.data);
        const href = orderId ? `/renew-order/${orderId}?product=pms` : '/my-orders?product=pms';
        pm2Window.current = window.open(href, '_blank');
        router.replace(href);
        return;
      }

      pm2Window.current = window.open('/my-orders', '_blank');
      router.replace('/my-orders');
    },
    [openPmsCallback, router, token, requestHeaders]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const action = resolveAction(event.data?.command ?? event.data?.action ?? event.data?.type);
      if (action) applyAction(action, event.data?.data);
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const action = resolveAction(detail?.command ?? detail?.action ?? detail?.type);
      if (action) applyAction(action, detail?.data);
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
