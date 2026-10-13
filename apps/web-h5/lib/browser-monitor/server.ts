// oxlint-disable-next-line import/no-unassigned-import -- Enforces the server-only dependency boundary.
import 'server-only';
import { headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import { after } from 'next/server';
import { isServerErrorReported, markServerErrorReported } from './server-error-state';
import { type MonitorServerRequest, sendServerErrorReport, serverRequestContext } from './server-report';

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
  unstable_rethrow(error);
  if (isServerErrorReported(error)) return;
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
    markServerErrorReported(error);
  } catch (schedulingError) {
    unstable_rethrow(schedulingError);
    console.warn('[server-monitor] Could not schedule error report.');
  }
}

export async function captureServerRouteError(error: unknown, request: Request) {
  await captureServerError(error, serverRequestContext(request));
}
