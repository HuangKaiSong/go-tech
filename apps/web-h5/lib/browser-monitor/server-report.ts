import {
  type ErrorReport,
  type MonitorContext,
  redactMonitorText,
  reportIdSchema,
  reportSchema
} from '@go-tech/monitor-contract';
import { monitorAuthentication } from './authentication';

function monitorPath(value: string) {
  try {
    return new URL(value, 'http://localhost').pathname.slice(0, 1000);
  } catch {
    return '/';
  }
}

export interface MonitorServerConfig {
  forward?: typeof fetch;
  ingestToken?: string;
  jwtSecret?: string;
  release?: string;
  serviceUrl?: string;
  timestamp?: number;
}

export interface MonitorServerRequest {
  headers: Headers;
  method: string;
  path: string;
  routePath?: string;
  routeType?: NonNullable<MonitorContext['request']>['routeType'];
}

export function serverRequestContext(request: Request): MonitorServerRequest {
  return {
    headers: new Headers(request.headers),
    path: new URL(request.url).pathname,
    method: request.method,
    routeType: 'route'
  };
}

function serverErrorCode(cause: unknown) {
  if (cause instanceof Error && 'code' in cause && typeof cause.code === 'string') return cause.code;
  return undefined;
}

function serverRequestDetails(error: Error | undefined): Pick<ErrorReport['error'], 'businessCode' | 'status'> {
  const status = error && 'status' in error ? error.status : undefined;
  const code = error && 'businessCode' in error ? error.businessCode : undefined;
  let businessCode: string | number | undefined;
  if (typeof code === 'string') businessCode = redactMonitorText(code, 100);
  else if (typeof code === 'number' && Number.isFinite(code)) businessCode = code;
  return {
    status:
      typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined,
    businessCode
  };
}

function describeServerError(error: unknown): ErrorReport['error'] {
  if (error instanceof Response) {
    return {
      kind: 'next-server',
      name: 'HttpError',
      message: redactMonitorText(`HTTP ${error.status} ${error.statusText}: ${error.url}`),
      status: error.status || undefined
    };
  }
  const value = error instanceof Error ? error : undefined;
  // Drizzle embeds SQL and parameters in its message. Retain only a stable failure code and stack frames.
  const database = value?.name === 'DrizzleQueryError' || value?.message.startsWith('Failed query:');
  const code = serverErrorCode(value?.cause);
  const digest = value && 'digest' in value && typeof value.digest === 'string' ? value.digest : undefined;
  return {
    ...serverRequestDetails(value),
    kind: 'next-server',
    name: redactMonitorText(value?.name ?? 'Error', 100),
    message: database
      ? `Database query failed${code ? ` (${redactMonitorText(code, 100)})` : ''}`
      : redactMonitorText(value?.message ?? 'Unknown server error'),
    stack: value?.stack
      ? redactMonitorText(
          value.stack
            .split('\n')
            .filter(line => /^\s*at /.test(line))
            .join('\n'),
          12000
        )
      : undefined,
    digest: digest ? redactMonitorText(digest, 100) : undefined
  };
}

export async function createServerErrorReport(
  error: unknown,
  request: MonitorServerRequest,
  config: MonitorServerConfig
): Promise<ErrorReport> {
  const sessionId = /(?:^|;\s*)GO_TECH_MONITOR_SESSION=([^;]+)/.exec(request.headers.get('cookie') ?? '')?.[1];
  const parsedSession = reportIdSchema.safeParse(sessionId);
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    timestamp: config.timestamp ?? Date.now(),
    timeSource: 'server',
    kind: 'error',
    error: describeServerError(error),
    context: {
      app: 'web-h5',
      sessionId: parsedSession.success ? parsedSession.data : crypto.randomUUID(),
      pageId: crypto.randomUUID(),
      path: monitorPath(request.path),
      release: (config.release ?? 'development').slice(0, 100),
      userAgent: (request.headers.get('user-agent') ?? 'unknown').slice(0, 500),
      language: (request.headers.get('accept-language') ?? 'unknown').slice(0, 50),
      viewport: { width: 0, height: 0 },
      device: {
        platform: request.headers.get('sec-ch-ua-platform')?.replaceAll('"', '').slice(0, 100),
        mobile: request.headers.has('sec-ch-ua-mobile') ? request.headers.get('sec-ch-ua-mobile') === '?1' : undefined
      },
      authentication: await monitorAuthentication(request.headers, config.jwtSecret),
      request: {
        method: request.method.slice(0, 20),
        routePath: request.routePath ? monitorPath(request.routePath) : undefined,
        routeType: request.routeType
      }
    },
    breadcrumbs: [],
    metrics: [],
    replay: { events: [], unavailableReason: 'server-error' }
  };
}

export async function sendServerErrorReport(
  error: unknown,
  request: MonitorServerRequest,
  config: MonitorServerConfig
) {
  const timestamp = config.timestamp ?? Date.now();
  const forward = config.forward ?? fetch;
  if (!config.serviceUrl || !config.ingestToken || monitorPath(request.path).startsWith('/api/browser-monitor')) return;
  try {
    const report = reportSchema.parse(await createServerErrorReport(error, request, { ...config, timestamp }));
    const response = await forward(new URL('/api/reports', config.serviceUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.ingestToken}` },
      body: JSON.stringify(report),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) console.warn(`[server-monitor] Upload failed (HTTP ${response.status}).`);
  } catch {
    // A monitoring outage must not replace the original error or break the friendly fallback.
    console.warn('[server-monitor] Upload failed.');
  }
}
