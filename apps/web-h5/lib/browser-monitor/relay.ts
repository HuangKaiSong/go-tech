import { MAX_REPORT_BYTES, reportSchema } from '@go-tech/monitor-contract';
import { monitorAuthentication } from './authentication';

const requests = new Map<string, { count: number; expires: number }>();

async function readReport(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_REPORT_BYTES) return null;
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
      if (size > MAX_REPORT_BYTES) {
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

function limited(request: Request) {
  const now = Date.now();
  for (const [key, bucket] of requests) if (bucket.expires <= now) requests.delete(key);
  const key = (request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local').trim().slice(0, 100);
  const bucket = requests.get(key);
  if (bucket) {
    bucket.count += 1;
    return bucket.count > 60;
  }
  if (requests.size >= 1000) return true;
  requests.set(key, { count: 1, expires: now + 60000 });
  return false;
}

/** Server-only adapter by dependency direction; credentials are never returned to the browser. */
export async function relayMonitorReport(
  request: Request,
  config: { allowedOrigins?: readonly string[]; ingestToken?: string; jwtSecret?: string; serviceUrl?: string },
  forward: typeof fetch = fetch
) {
  if (!config.serviceUrl || !config.ingestToken) return reply(503, 'Browser monitoring is not configured');
  if (!hasAllowedOrigin(request, config.allowedOrigins)) return reply(403, 'Invalid origin');
  if (limited(request)) return reply(429, 'Too many monitor reports');
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return reply(415, 'Expected JSON');
  if (request.headers.has('content-encoding')) return reply(415, 'Compressed reports are not supported');
  if (Number(request.headers.get('content-length')) > MAX_REPORT_BYTES) return reply(413, 'Report too large');
  let value: unknown;
  try {
    value = await readReport(request);
  } catch {
    return reply(400, 'Invalid JSON');
  }
  if (value === null) return reply(413, 'Empty or oversized report');
  const parsed = reportSchema.safeParse(value);
  if (!parsed.success) return reply(400, 'Invalid monitor report');
  if (parsed.data.kind === 'error' && parsed.data.error.kind === 'next-server')
    return reply(400, 'Server errors must be reported by the server');
  try {
    parsed.data.context.authentication = await monitorAuthentication(request.headers, config.jwtSecret);
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
