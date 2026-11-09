'use client';
import { useRuntimeConfig } from '@/lib/runtime-config/provider';

import { type ReactNode, createContext, useCallback, useContext, useEffect } from 'react';
import { toast } from 'sonner';
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

function matchesOrigin(host: string | undefined, origin: string) {
  if (!host || origin === 'null') return false;
  try {
    return new URL(host).origin === origin;
  } catch {
    return false;
  }
}

export function TrialWindowProvider({ children }: { children: ReactNode }) {
  const config = useRuntimeConfig().values;
  const { token } = useAuth();
  const { isMobile } = useViewMode();
  const desktopHost = config.NEXT_PUBLIC_PMS_TRIAL_HOST;
  const mobileHost = config.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST;
  const trialHost = isMobile ? mobileHost : desktopHost;

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
      openTrialTarget(`${trialHost}/oauth/${uri}`);
    },
    [trialHost]
  );

  const applyAction = useCallback(
    async (action: PmsWindowAction, data: unknown, returnDestination: boolean) => {
      let href: string | undefined = '/service-plan?product=pms';
      if (action === 'trial-env') {
        href = undefined;
        await startFreeTrial({
          generateCallback: uri => {
            href = new URL(`${trialHost}/oauth/${uri}`).href;
          },
          onTrialExpired: () => {
            href = '/service-plan?product=pms';
          },
          token
        });
      } else if (action === 'renew') {
        if (typeof data !== 'string' && typeof data !== 'number') throw new Error('Missing PMS tenant ID');
        const query = new URLSearchParams({ tenantId: String(data) });
        const headers = requestHeaders();

        const response = await clientFetch(`/go-tech/platform/packageOrder/relateOrderId?${query}`, { headers });
        const result = await response.json();
        if (String(result?.code) !== '200') throw new Error('Invalid PMS renewal response');
        const orderId = resolveOrderId(result.data);
        href = orderId ? `/renew-order/${orderId}?product=pms` : '/my-orders?product=pms';
      } else if (action === 'order') {
        href = '/my-orders';
      }

      if (returnDestination) return href;
      if (href && window.open(href, '_blank') === null) {
        toast.warning('新分頁被瀏覽器攔截，請允許開啟新分頁後再試。');
      }
    },
    [trialHost, token, requestHeaders]
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
        ok = !reply?.returnDestination || href !== undefined;
      } catch (error) {
        if (!isNotifiedClientHttpError(error)) toast.error('暫時無法完成操作，請稍後再試。');
      } finally {
        reply?.port.postMessage(href ? { ok, href } : { ok }, []);
        reply?.port.close();
      }
    };

    const handleMessage = (event: MessageEvent) => {
      const newTabAction = event.data?.pmsNewTabAction;
      if (newTabAction === 'trial-env' || newTabAction === 'renew') {
        const port = event.ports[0];
        if (!port) return;
        // 試用目的地含登入碼，只回傳給平台配置的 PMS 來源。
        if (!matchesOrigin(desktopHost, event.origin) && !matchesOrigin(mobileHost, event.origin)) {
          port.postMessage({ ok: false }, []);
          port.close();
          return;
        }
        runAction(newTabAction, event.data?.data, { port, returnDestination: true });
        return;
      }
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
  }, [applyAction, desktopHost, mobileHost]);

  return <TrialWindowContext.Provider value={{ openPmsCallback }}>{children}</TrialWindowContext.Provider>;
}

export function useTrialWindow() {
  const context = useContext(TrialWindowContext);
  if (!context) throw new Error('useTrialWindow must be used inside TrialWindowProvider');

  return context;
}
