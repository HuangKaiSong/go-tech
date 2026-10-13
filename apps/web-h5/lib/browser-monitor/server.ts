// oxlint-disable-next-line import/no-unassigned-import -- Enforces the server-only dependency boundary.
import 'server-only';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { type MonitorServerRequest, sendServerErrorReport } from './server-report';

export function serverMonitorConfig() {
  return {
    serviceUrl: process.env.BROWSER_MONITOR_SERVICE_URL,
    ingestToken: process.env.BROWSER_MONITOR_INGEST_TOKEN,
    jwtSecret: process.env.PLATFORM_JWT_SECRET,
    release: process.env.NEXT_PUBLIC_BROWSER_MONITOR_RELEASE
  };
}

/** Call from catches which intentionally handle a server failure instead of rethrowing it. */
export async function captureServerError(error: unknown, request?: MonitorServerRequest) {
  const timestamp = Date.now();
  const config = serverMonitorConfig();
  if (!config.serviceUrl || !config.ingestToken) return;
  try {
    // Server Components cannot read request APIs inside after(). Snapshot them first.
    const incoming = request?.headers ?? new Headers(await headers());
    const snapshot = request ?? {
      headers: incoming,
      path: incoming.get('x-go-tech-pathname') ?? '/',
      method: 'GET',
      routeType: 'render' as const
    };
    after(() => sendServerErrorReport(error, snapshot, { ...config, timestamp }));
  } catch {
    console.warn('[server-monitor] Could not schedule error report.');
  }
}
