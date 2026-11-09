'use client';
import { useRuntimeConfig } from '@/lib/runtime-config/provider';

import { type ReactNode, createContext, useCallback, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { useProgressRouter } from '@/app/hooks/use-progress-router';
import { openTrialTarget, startFreeTrial } from '@/app/lib/go-now';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { isNotifiedClientHttpError } from '@/lib/client-http/client-http-error';
import { useAuth } from './AuthContext';
import { useViewMode } from './view-mode-context';

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
  const config = useRuntimeConfig().values;
  const router = useProgressRouter();
  const { token } = useAuth();
  const { isMobile } = useViewMode();

  const requestHeaders = useCallback(
    () =>
      new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Type': 'platform_customer'
      }),
    [token]
  );

  const openPmsCallback = useCallback(
    (uri: string) => {
      const trialHost = isMobile ? config.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST : config.NEXT_PUBLIC_PMS_TRIAL_HOST;
      openTrialTarget(`${trialHost}/oauth/${uri}`);
    },
    [isMobile, config]
  );

  const applyAction = useCallback(
    async (action: PmsWindowAction, data: unknown, returnDestination: boolean) => {
      if (action === 'trial-env') {
        await startFreeTrial({
          generateCallback: openPmsCallback,
          onTrialExpired: () => router.push('/service-plan'),
          token
        });
        return;
      }

      let href = '/service-plan?product=pms';
      if (action === 'renew') {
        if (typeof data !== 'string' && typeof data !== 'number') throw new Error('Missing PMS tenant ID');
        const query = new URLSearchParams({ tenantId: String(data) });
        const headers = requestHeaders();

        const response = await clientFetch(`/go-tech/platform/packageOrder/relateOrderId?${query}`, { headers });
        const result = await response.json();
        if (String(result?.code) !== '200') throw new Error('Invalid PMS renewal response');
        const orderId = resolveOrderId(result.data);
        href = orderId ? `/renew-order/${orderId}?product=pms` : '/my-orders?product=pms';
      } else if (action === 'order') {
        window.open('/my-orders', '_blank');
        router.replace('/my-orders');
        return;
      }

      if (returnDestination) return href;
      if (window.open(href, '_blank') === null) {
        window.location.replace(href);
      } else {
        router.replace(href);
      }
    },
    [openPmsCallback, router, token, requestHeaders]
  );

  useEffect(() => {
    const runAction = async (
      action: PmsWindowAction,
      data: unknown,
      reply?: { port: MessagePort; returnDestination: boolean }
    ) => {
      let ok = false;
      let href: string | undefined;
      try {
        href = await applyAction(action, data, reply?.returnDestination ?? false);
        ok = true;
      } catch (error) {
        if (!isNotifiedClientHttpError(error)) toast.error('暫時無法完成操作，請稍後再試。');
      } finally {
        reply?.port.postMessage(href ? { ok, href } : { ok }, []);
        reply?.port.close();
      }
    };

    const handleMessage = (event: MessageEvent) => {
      const command = event.data?.command;
      const action = resolveAction(command ?? event.data?.action ?? event.data?.type);
      const port = command === 'renew' || command === 'service-plan' ? event.ports[0] : undefined;
      const reply = port ? { port, returnDestination: event.data?.returnDestination === true } : undefined;
      if (action) runAction(action, event.data?.data, reply);
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const action = resolveAction(detail?.command ?? detail?.action ?? detail?.type);
      if (action) runAction(action, detail?.data);
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
