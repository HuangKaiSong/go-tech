'use client';

import {
  type BrowserMonitor,
  type ReportDeliveryContext,
  ReportDeliveryError,
  startBrowserMonitor,
  uploadReportChunks
} from '@go-tech/browser-monitor';
import type { MonitorError, MonitorReport } from '@go-tech/monitor-contract';
import { clientFetch } from '@/lib/client-http/client-fetch';
import { ClientHttpError } from '@/lib/client-http/client-http-error';
import { subscribeClientHttpDiagnostics } from '@/lib/client-http/error-events';

let monitor: BrowserMonitor | undefined;
let unsubscribe: (() => void) | undefined;

async function upload(report: MonitorReport, delivery: ReportDeliveryContext) {
  async function send(value: unknown, chunk = false) {
    const body = JSON.stringify(value);
    try {
      const response = await clientFetch(
        '/api/browser-monitor',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Monitor-Delivery': delivery.recovered || Date.now() - report.timestamp > 60000 ? 'recovered' : 'live',
            'X-Monitor-Chunk': chunk ? '1' : '0'
          },
          body,
          keepalive: new TextEncoder().encode(body).length < 24000,
          signal: AbortSignal.timeout(30000)
        },
        { feedback: 'silent', diagnostics: false }
      );
      return response;
    } catch (error) {
      const status = error instanceof ClientHttpError ? error.status : undefined;
      const raw = error instanceof ClientHttpError ? error.response?.headers.get('Retry-After') : null;
      const seconds = raw ? Number(raw) : Number.NaN;
      let retryAfter = 0;
      if (raw) retryAfter = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(raw) - Date.now();
      throw new ReportDeliveryError(
        status === undefined || status === 408 || status === 429 || status >= 500,
        Number.isFinite(retryAfter) ? Math.max(0, retryAfter) : 0
      );
    }
  }
  const bytes = new TextEncoder().encode(JSON.stringify(report)).length;
  if (bytes < 24000) {
    const response = await send(report);
    const ack: unknown = await response.json();
    if (
      typeof ack !== 'object' ||
      ack === null ||
      !('data' in ack) ||
      typeof ack.data !== 'object' ||
      ack.data === null ||
      !('id' in ack.data) ||
      ack.data.id !== report.id
    )
      throw new Error('Missing monitor commit acknowledgement');
    return;
  }
  await uploadReportChunks(report, delivery.progress, {
    send: async chunk => {
      const response = await send(chunk, true);
      const ack: unknown = await response.json();
      if (
        typeof ack !== 'object' ||
        ack === null ||
        !('data' in ack) ||
        typeof ack.data !== 'object' ||
        ack.data === null ||
        !('id' in ack.data) ||
        ack.data.id !== report.id ||
        !('complete' in ack.data) ||
        typeof ack.data.complete !== 'boolean' ||
        !('nextIndex' in ack.data) ||
        typeof ack.data.nextIndex !== 'number'
      )
        throw new Error('Invalid monitor chunk acknowledgement');
      return { complete: ack.data.complete, nextIndex: ack.data.nextIndex };
    },
    checkpoint: delivery.checkpoint
  });
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
