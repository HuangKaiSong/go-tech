'use client';

import { type BrowserMonitor, startBrowserMonitor } from '@go-tech/browser-monitor';
import type { MonitorError, MonitorReport } from '@go-tech/monitor-contract';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { ClientHttpError } from '@/lib/client-http/client-http-error';
import { subscribeClientHttpDiagnostics } from '@/lib/client-http/error-events';

let monitor: BrowserMonitor | undefined;
let unsubscribe: (() => void) | undefined;

async function upload(report: MonitorReport) {
  const body = JSON.stringify(report);
  // Browsers enforce a ~64 KiB aggregate limit for keepalive requests.
  const keepalive = new TextEncoder().encode(body).length < 60000;
  try {
    await clientFetch(
      '/api/browser-monitor',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive,
        signal: AbortSignal.timeout(10000)
      },
      { feedback: 'silent', diagnostics: false }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      const status = error instanceof ClientHttpError ? error.status : undefined;
      console.warn(
        `[browser-monitor] Upload failed${status ? ` (HTTP ${status})` : ''}; check /api/browser-monitor in Network.`
      );
    }
    throw error;
  }
}

export function initializeBrowserMonitor() {
  if (monitor || process.env.NEXT_PUBLIC_BROWSER_MONITOR_ENABLED !== 'true') return;
  try {
    monitor = startBrowserMonitor({ release: process.env.NEXT_PUBLIC_BROWSER_MONITOR_RELEASE, transport: upload });
    // Non-authentication UUID cookie correlates server requests with this browser session.
    document.cookie = `GO_TECH_MONITOR_SESSION=${monitor.getContext().sessionId}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    unsubscribe = subscribeClientHttpDiagnostics(event => {
      monitor?.captureError(`Request failed: ${event.kind}`, {
        kind: event.kind,
        name: 'ClientHttpError',
        businessCode: event.businessCode,
        status: event.status
      });
    });
  } catch {
    if (process.env.NODE_ENV === 'development') console.warn('[browser-monitor] Initialization failed.');
    // Optional monitoring cannot prevent hydration or page interactions.
  }
}

export function captureBrowserError(error: unknown, extra?: Partial<MonitorError>) {
  monitor?.captureError(error, extra);
}

export function recordBrowserNavigation(url: string) {
  monitor?.navigation(url);
}

export function stopBrowserMonitor() {
  unsubscribe?.();
  unsubscribe = undefined;
  monitor?.stop();
  monitor = undefined;
}
