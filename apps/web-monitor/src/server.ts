import { timingSafeEqual } from 'node:crypto';
import { type IncomingMessage, type ServerResponse, createServer } from 'node:http';
import { MAX_REPORT_BYTES, reportIdSchema, reportSchema } from '@go-tech/monitor-contract';
import { type ListFilter, ReportStore } from './store';

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function authorized(request: IncomingMessage, token: string) {
  const actual = Buffer.from(request.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function json(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(data));
}

async function body(request: IncomingMessage) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Expected application/json');
  }
  if (request.headers['content-encoding'] && request.headers['content-encoding'] !== 'identity') {
    throw new HttpError(415, 'Compressed requests are not supported');
  }
  if (Number(request.headers['content-length']) > MAX_REPORT_BYTES) throw new HttpError(413, 'Report too large');
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_REPORT_BYTES) throw new HttpError(413, 'Report too large');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

function listFilter(url: URL): ListFilter {
  const kind = url.searchParams.get('kind') ?? undefined;
  if (kind !== undefined && kind !== 'error' && kind !== 'performance') throw new HttpError(400, 'Invalid kind');
  const limit = Number(url.searchParams.get('limit') ?? 20);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new HttpError(400, 'Invalid limit');
  const sessionId = url.searchParams.get('sessionId') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  for (const id of [sessionId, cursor]) {
    if (id !== undefined && !reportIdSchema.safeParse(id).success) throw new HttpError(400, 'Invalid UUID');
  }
  return { kind, limit, sessionId, cursor, path: url.searchParams.get('path') ?? undefined };
}

export function createMonitorServer(store: ReportStore, tokens: { ingest: string; query: string }) {
  if (!tokens.ingest || !tokens.query || tokens.ingest === tokens.query) {
    throw new Error('Separate non-empty ingest and query tokens are required');
  }
  const server = createServer((request, response) => {
    handle(request, response).catch(error => {
      if (response.headersSent || response.destroyed) return;
      const status = error instanceof HttpError ? error.status : 500;
      json(response, status, { code: status, message: status === 500 ? 'Monitor service error' : error.message });
    });
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;

  async function handle(request: IncomingMessage, response: ServerResponse) {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname === '/health' && request.method === 'GET') {
      json(response, 200, { code: 200, status: 'ok' });
      return;
    }
    if (url.pathname === '/api/reports' && request.method === 'POST') {
      if (!authorized(request, tokens.ingest)) throw new HttpError(401, 'Unauthorized');
      const parsed = reportSchema.safeParse(await body(request));
      if (!parsed.success) throw new HttpError(400, 'Invalid monitor report');
      const saved = await store.save(parsed.data);
      json(response, saved.duplicate ? 200 : 201, { code: 200, data: saved });
      return;
    }
    if (!authorized(request, tokens.query)) throw new HttpError(401, 'Unauthorized');
    if (url.pathname === '/api/reports' && request.method === 'GET') {
      json(response, 200, { code: 200, data: store.list(listFilter(url)) });
      return;
    }
    const match = /^\/api\/reports\/([^/]+)(\/replay)?$/.exec(url.pathname);
    if (match && request.method === 'GET') {
      const id = match[1];
      if (!reportIdSchema.safeParse(id).success) throw new HttpError(400, 'Invalid report ID');
      const report = await store.get(id);
      if (!report) throw new HttpError(404, 'Report not found');
      if (match[2]) {
        if (report.kind !== 'error' || report.replay.events.length === 0)
          throw new HttpError(404, 'Replay unavailable');
        // Raw event array can be passed directly to rrweb-player/Replayer.
        json(response, 200, report.replay.events);
      } else {
        json(response, 200, { code: 200, data: report });
      }
      return;
    }
    throw new HttpError(404, 'Not found');
  }
  return server;
}
