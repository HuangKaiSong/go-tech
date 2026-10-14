import { timingSafeEqual } from 'node:crypto';
import { type IncomingMessage, type ServerResponse, createServer } from 'node:http';
import {
  type ErrorReport,
  MAX_REPORT_BYTES,
  type MonitorReport,
  authenticationSchema,
  reportChunkSchema,
  reportIdSchema,
  reportSchema
} from '@go-tech/monitor-contract';
import { InvalidUploadChunk } from './storage/chunk-upload';
import type { ListFilter, MonitorReportStore } from './storage/report-store';

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

function hasBrowserReplay(report: MonitorReport): report is ErrorReport {
  return report.kind === 'error' && report.error.kind !== 'next-server' && report.replay.events.length > 0;
}

function hasServerReplay(report: MonitorReport) {
  return report.kind === 'error' && report.error.kind === 'next-server' && report.replay.events.length > 0;
}

export function createMonitorServer(
  store: MonitorReportStore,
  tokens: { ingest: string; query: string },
  options: { maxInFlightUploads?: number } = {}
) {
  if (!tokens.ingest || !tokens.query || tokens.ingest === tokens.query) {
    throw new Error('Separate non-empty ingest and query tokens are required');
  }
  const uploadLimit = options.maxInFlightUploads ?? 16;
  if (!Number.isSafeInteger(uploadLimit) || uploadLimit < 1) throw new Error('Invalid upload concurrency');
  let inFlightUploads = 0;
  const server = createServer((request, response) => {
    handle(request, response).catch(error => {
      if (response.headersSent || response.destroyed) return;
      let status = 500;
      if (error instanceof HttpError) status = error.status;
      if (error instanceof InvalidUploadChunk) status = 400;
      json(response, status, { code: status, message: status === 500 ? 'Monitor service error' : error.message });
    });
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;

  async function ingest(request: IncomingMessage, response: ServerResponse, chunks = false) {
    if (!authorized(request, tokens.ingest)) throw new HttpError(401, 'Unauthorized');
    if (inFlightUploads >= uploadLimit) throw new HttpError(503, 'Monitor ingestion is busy');
    inFlightUploads += 1;
    try {
      const value = await body(request);
      if (chunks) {
        if (!store.saveChunk) throw new HttpError(503, 'Chunk upload unavailable');
        if (typeof value !== 'object' || value === null || !('chunk' in value))
          throw new HttpError(400, 'Invalid chunk envelope');
        const chunk = reportChunkSchema.safeParse(value.chunk);
        const authentication = authenticationSchema
          .optional()
          .safeParse('authentication' in value ? value.authentication : undefined);
        if (!chunk.success || !authentication.success) throw new HttpError(400, 'Invalid chunk');
        const saved = await store.saveChunk(chunk.data, authentication.data);
        json(response, 200, { code: 200, data: saved });
        return;
      }
      const parsed = reportSchema.safeParse(value);
      if (!parsed.success) throw new HttpError(400, 'Invalid monitor report');
      if (hasServerReplay(parsed.data)) throw new HttpError(400, 'Server errors cannot contain browser replay');
      const saved = await store.save(parsed.data);
      json(response, saved.duplicate ? 200 : 201, { code: 200, data: saved });
    } finally {
      inFlightUploads -= 1;
    }
  }

  async function handle(request: IncomingMessage, response: ServerResponse) {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname === '/health' && request.method === 'GET') {
      json(response, 200, { code: 200, status: 'ok' });
      return;
    }
    if (url.pathname === '/api/report-chunks' && request.method === 'POST') {
      await ingest(request, response, true);
      return;
    }
    if (url.pathname === '/api/reports' && request.method === 'POST') {
      await ingest(request, response);
      return;
    }
    if (!authorized(request, tokens.query)) throw new HttpError(401, 'Unauthorized');
    if (url.pathname === '/api/reports' && request.method === 'GET') {
      json(response, 200, { code: 200, data: await store.list(listFilter(url)) });
      return;
    }
    if (url.pathname === '/api/storage' && request.method === 'GET') {
      json(response, 200, { code: 200, data: { storage: 'mysql', database: store.metrics?.() } });
      return;
    }
    const match = /^\/api\/reports\/([^/]+)(\/replay)?$/.exec(url.pathname);
    if (match && request.method === 'GET') {
      const id = match[1];
      if (!reportIdSchema.safeParse(id).success) throw new HttpError(400, 'Invalid report ID');
      const stored = await store.getStored(id);
      if (!stored) throw new HttpError(404, 'Report not found');
      const { receivedAt, report } = stored;
      if (match[2]) {
        if (!hasBrowserReplay(report)) throw new HttpError(404, 'Replay unavailable');
        // Raw event array can be passed directly to rrweb-player/Replayer.
        json(response, 200, report.replay.events);
      } else {
        json(response, 200, { code: 200, data: report, receivedAt });
      }
      return;
    }
    throw new HttpError(404, 'Not found');
  }
  return server;
}
