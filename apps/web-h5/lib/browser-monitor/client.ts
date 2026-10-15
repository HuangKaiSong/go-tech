'use client';

import {
  type BrowserMonitor,
  ReportDeliveryError,
  createAdaptiveReportTransport,
  startBrowserMonitor
} from '@go-tech/browser-monitor';
import { type MonitorError, reportChunkAckSchema } from '@go-tech/monitor-contract';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { ClientHttpError } from '@/lib/client-http/client-http-error';
import { subscribeClientHttpDiagnostics } from '@/lib/client-http/error-events';

let monitor: BrowserMonitor | undefined;
let unsubscribe: (() => void) | undefined;

function uploadError(error: unknown) {
  const status = error instanceof ClientHttpError ? error.status : undefined;
  const raw = error instanceof ClientHttpError ? error.response?.headers.get('Retry-After') : null;
  const seconds = raw ? Number(raw) : Number.NaN;
  let retryAfter = 0;
  if (raw) retryAfter = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(raw) - Date.now();
  return new ReportDeliveryError(
    status === undefined || status === 408 || status === 413 || status === 429 || status >= 500,
    Number.isFinite(retryAfter) ? Math.max(0, retryAfter) : 0,
    status === undefined || status === 408 || status === 413
  );
}

const upload = createAdaptiveReportTransport(async (value, options) => {
  let response: Response;
  try {
    response = await clientFetch(
      '/api/browser-monitor',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Monitor-Delivery': options.recovered ? 'recovered' : 'live',
          'X-Monitor-Chunk': options.chunk ? '1' : '0'
        },
        body: JSON.stringify(value),
        keepalive: options.keepalive,
        signal: AbortSignal.timeout(30000)
      },
      { feedback: 'silent', diagnostics: false }
    );
  } catch (error) {
    throw uploadError(error);
  }
  const ack: unknown = await response.json();
  if (options.chunk) {
    const parsed = reportChunkAckSchema.safeParse(ack);
    if (!parsed.success) throw new Error('Invalid monitor chunk acknowledgement');
    return parsed.data.data;
  }
  if (
    typeof ack !== 'object' ||
    ack === null ||
    !('data' in ack) ||
    typeof ack.data !== 'object' ||
    ack.data === null ||
    !('id' in ack.data) ||
    typeof ack.data.id !== 'string'
  )
    throw new Error('Missing monitor commit acknowledgement');
  return { id: ack.data.id };
});

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
