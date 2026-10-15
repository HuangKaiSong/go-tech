import {
  MAX_REPORT_BYTES,
  MAX_REPORT_CHUNK_BODY_BYTES,
  type ReportChunk,
  reportChunkAckSchema,
  reportChunkSchema,
  reportSchema
} from '@go-tech/monitor-contract';
import { monitorAuthentication } from './authentication';

const requests = new Map<string, { count: number; expires: number }>();

async function readReport(request: Request, maxBytes: number) {
  if (Number(request.headers.get('content-length')) > maxBytes) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      // oxlint-disable-next-line no-await-in-loop -- Stream reads must be sequential to bound memory.
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        // oxlint-disable-next-line no-await-in-loop -- Stop the oversized stream before accepting another chunk.
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function limited(request: Request, chunks = false) {
  const now = Date.now();
  for (const [key, bucket] of requests) if (bucket.expires <= now) requests.delete(key);
  const key = `${chunks ? 'chunks' : 'reports'}:${(request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local').trim().slice(0, 100)}`;
  const bucket = requests.get(key);
  if (bucket) {
    bucket.count += 1;
    return bucket.count > (chunks ? 600 : 60);
  }
  if (requests.size >= 1000) return true;
  requests.set(key, { count: 1, expires: now + 60000 });
  return false;
}

interface RelayConfig {
  allowedOrigins?: readonly string[];
  ingestToken?: string;
  jwtSecret?: string;
  serviceUrl?: string;
}

function deliveryAuthentication(request: Request, jwtSecret?: string) {
  return request.headers.get('x-monitor-delivery') === 'recovered'
    ? Promise.resolve({ status: 'unverified' as const })
    : monitorAuthentication(request.headers, jwtSecret);
}

async function forwardChunk(
  request: Request,
  chunk: ReportChunk,
  options: { config: RelayConfig; forward: typeof fetch }
) {
  const { config, forward } = options;
  try {
    const authentication = await deliveryAuthentication(request, config.jwtSecret);
    const response = await forward(new URL('/api/report-chunks', config.serviceUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.ingestToken}` },
      body: JSON.stringify({ chunk, authentication }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!response.ok) return reply(response.status === 400 ? 400 : 502, 'Monitor chunk upload failed');
    const ack = reportChunkAckSchema.safeParse(await response.json());
    if (!ack.success || ack.data.data.id !== chunk.id) return reply(502, 'Invalid monitor acknowledgement');
    return Response.json(ack.data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return reply(502, 'Monitor service unavailable');
  }
}

/** Server-only adapter by dependency direction; credentials are never returned to the browser. */
export async function relayMonitorReport(request: Request, config: RelayConfig, forward: typeof fetch = fetch) {
  if (!config.serviceUrl || !config.ingestToken) return reply(503, 'Browser monitoring is not configured');
  if (!hasAllowedOrigin(request, config.allowedOrigins)) return reply(403, 'Invalid origin');
  const chunks = request.headers.get('x-monitor-chunk') === '1';
  if (limited(request, chunks)) return throttled();
  const maxBytes = chunks ? MAX_REPORT_CHUNK_BODY_BYTES : MAX_REPORT_BYTES;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return reply(415, 'Expected JSON');
  if (request.headers.has('content-encoding')) return reply(415, 'Compressed reports are not supported');
  if (Number(request.headers.get('content-length')) > MAX_REPORT_BYTES) return reply(413, 'Report too large');
  let value: unknown;
  try {
    value = await readReport(request, maxBytes);
  } catch {
    return reply(400, 'Invalid JSON');
  }
  if (value === null) return reply(413, 'Empty or oversized report');
  const chunk = reportChunkSchema.safeParse(value);
  if (chunk.success) return forwardChunk(request, chunk.data, { config, forward });
  const parsed = reportSchema.safeParse(value);
  if (!parsed.success) return reply(400, 'Invalid monitor report');
  if (parsed.data.kind === 'error' && parsed.data.error.kind === 'next-server')
    return reply(400, 'Server errors must be reported by the server');
  try {
    parsed.data.context.authentication = await deliveryAuthentication(request, config.jwtSecret);
    parsed.data.context.userAgent = (request.headers.get('user-agent') ?? parsed.data.context.userAgent).slice(0, 500);
    const response = await forward(new URL('/api/reports', config.serviceUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.ingestToken}` },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!response.ok) return reply(502, 'Monitor service unavailable');
    return Response.json({ code: 200, data: { id: parsed.data.id } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return reply(502, 'Monitor service unavailable');
  }
}

function throttled() {
  return Response.json(
    { code: 429, message: 'Too many monitor reports' },
    { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } }
  );
}

function reply(status: number, message: string) {
  return Response.json({ code: status, message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function hasAllowedOrigin(request: Request, allowedOrigins: readonly string[] = []) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !['http:', 'https:'].includes(parsed.protocol)) return false;
    if (allowedOrigins.includes(origin)) return true;
    const internalUrl = new URL(request.url);
    const host = request.headers.get('host') ?? internalUrl.host;
    // Do not trust caller-provided X-Forwarded-Host. Proxies must preserve Host
    // or explicitly configure their public origins on the server.
    if (/[\\/@?#\s]/.test(host)) return false;
    return origin === new URL(`${internalUrl.protocol}//${host}`).origin;
  } catch {
    return false;
  }
}
