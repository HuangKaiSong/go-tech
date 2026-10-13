import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type MonitorReport, reportListResponseSchema, reportSchema } from '@go-tech/monitor-contract';
import { afterEach, describe, expect, it } from 'vitest';
import { createMonitorServer } from '../src/server';
import { ReportStore } from '../src/store';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).toReversed()) {
    // oxlint-disable-next-line no-await-in-loop -- Close the server before removing its storage directory.
    await cleanup();
  }
});

function report(kind: 'error' | 'performance' = 'error'): MonitorReport {
  const common = {
    schemaVersion: 1 as const,
    id: randomUUID(),
    timestamp: Date.now(),
    context: {
      app: 'web-h5' as const,
      sessionId: randomUUID(),
      pageId: randomUUID(),
      path: '/en/dashboard',
      release: 'test',
      userAgent: 'test-browser',
      language: 'en',
      viewport: { width: 100, height: 100 }
    },
    metrics: []
  };
  return kind === 'performance'
    ? { ...common, kind, hasError: false }
    : {
        ...common,
        kind,
        error: { kind: 'javascript', name: 'Error', message: 'test error' },
        breadcrumbs: [],
        replay: {
          events: [
            { type: 4, timestamp: 1, data: { href: 'http://localhost/en' } },
            { type: 2, timestamp: 2, data: { node: { type: 0 }, initialOffset: { top: 0, left: 0 } } }
          ]
        }
      };
}

async function setup(maxReports = 100) {
  const directory = await mkdtemp(join(tmpdir(), 'web-monitor-'));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  const store = new ReportStore(directory, 86400000, maxReports);
  await store.initialize();
  const server = createMonitorServer(store, { ingest: 'ingest-test', query: 'query-test' });
  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });
  cleanups.push(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      })
  );
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server address');
  return { store, directory, url: `http://127.0.0.1:${address.port}` };
}

describe('monitor API', () => {
  it('stores server credentials only in authenticated details and returns no replay', async () => {
    const { directory, store, url } = await setup();
    const value = report();
    if (value.kind !== 'error') throw new Error('Expected error report');
    value.error.kind = 'next-server';
    value.timeSource = 'server';
    value.replay = { events: [], unavailableReason: 'server-error' };
    value.context.authentication = {
      status: 'verified',
      userId: '42',
      username: 'test-user',
      token: 'test-token',
      cookie: 'session=test-cookie'
    };
    await store.save(value);
    const headers = { Authorization: 'Bearer query-test' };
    const detail: unknown = await (await fetch(`${url}/api/reports/${value.id}`, { headers })).json();
    if (typeof detail !== 'object' || detail === null || !('data' in detail) || !('receivedAt' in detail))
      throw new Error('Invalid detail response');
    expect(reportSchema.parse(detail.data).context.authentication?.token).toBe('test-token');
    expect(detail.receivedAt).toBeGreaterThanOrEqual(value.timestamp);
    const list = reportListResponseSchema.parse(await (await fetch(`${url}/api/reports`, { headers })).json());
    expect(list.data.items[0].context.authentication).toEqual({
      status: 'verified',
      userId: '42',
      username: 'test-user'
    });
    expect(JSON.stringify(list)).not.toContain('test-token');
    expect((await fetch(`${url}/api/reports/${value.id}/replay`, { headers })).status).toBe(404);
    expect((await fetch(`${url}/api/reports/${value.id}`)).status).toBe(401);
    const restored = new ReportStore(directory, 86400000, 100);
    await restored.initialize();
    expect((await restored.get(value.id))?.context.authentication?.token).toBe('test-token');
    expect(JSON.stringify(restored.list({ limit: 20 }))).not.toContain('test-token');
  });
  it('persists reports, lists metadata, exports rrweb JSON and survives restart', async () => {
    const { directory, url } = await setup();
    const error = report();
    const performance = report('performance');
    for (const value of [error, performance]) {
      // oxlint-disable-next-line no-await-in-loop -- Exercise ingestion in a deterministic order before pagination.
      const response = await fetch(`${url}/api/reports`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ingest-test', 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      expect(response.status).toBe(201);
    }
    const duplicate = await fetch(`${url}/api/reports`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ingest-test', 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    });
    expect(duplicate.status).toBe(200);
    const headers = { Authorization: 'Bearer query-test' };
    const list = reportListResponseSchema.parse(
      await (await fetch(`${url}/api/reports?kind=error&limit=1`, { headers })).json()
    );
    expect(list.data.items).toHaveLength(1);
    expect(list.data.items[0].replayEventCount).toBe(2);
    expect('replay' in list.data.items[0]).toBe(false);
    const detail: unknown = await (await fetch(`${url}/api/reports/${error.id}`, { headers })).json();
    if (typeof detail !== 'object' || detail === null || !('data' in detail)) throw new Error('Invalid response');
    expect(reportSchema.parse(detail.data)).toEqual(error);
    const replay = await fetch(`${url}/api/reports/${error.id}/replay`, { headers });
    expect(await replay.json()).toEqual(error.kind === 'error' ? error.replay.events : []);
    expect(replay.headers.get('cache-control')).toBe('no-store');
    const restored = new ReportStore(directory, 86400000, 100);
    await restored.initialize();
    expect(await restored.get(error.id)).toEqual(error);
    expect(restored.list({ kind: 'performance', limit: 20 }).items).toHaveLength(1);
  });
  it('isolates ingestion from queries and rejects malformed and oversized input', async () => {
    const { url } = await setup();
    expect((await fetch(`${url}/health`)).status).toBe(200);
    expect((await fetch(`${url}/api/reports`)).status).toBe(401);
    expect((await fetch(`${url}/api/reports`, { headers: { Authorization: 'Bearer ingest-test' } })).status).toBe(401);
    const headers = { Authorization: 'Bearer ingest-test', 'Content-Type': 'application/json' };
    expect(
      (
        await fetch(`${url}/api/reports`, {
          method: 'POST',
          headers: { ...headers, Authorization: 'Bearer query-test' },
          body: '{}'
        })
      ).status
    ).toBe(401);
    expect((await fetch(`${url}/api/reports`, { method: 'POST', headers, body: '{' })).status).toBe(400);
    expect(
      (
        await fetch(`${url}/api/reports`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...report(), token: 'secret' })
        })
      ).status
    ).toBe(400);
    expect(
      (
        await fetch(`${url}/api/reports`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ junk: 'x'.repeat(4 * 1024 * 1024) })
        })
      ).status
    ).toBe(413);
    expect(
      (await fetch(`${url}/api/reports/not-a-uuid`, { headers: { Authorization: 'Bearer query-test' } })).status
    ).toBe(400);
    expect(
      (await fetch(`${url}/api/reports?limit=1000`, { headers: { Authorization: 'Bearer query-test' } })).status
    ).toBe(400);
  });
  it('bounds disk retention and paginates', async () => {
    const { store } = await setup(2);
    const first = report();
    await store.save(first);
    await new Promise(resolve => {
      setTimeout(resolve, 2);
    });
    await store.save(report());
    await store.save(report('performance'));
    expect(await store.get(first.id)).toBeNull();
    const page = store.list({ limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
    const next = store.list({ limit: 1, cursor: page.nextCursor ?? undefined });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).not.toBe(page.items[0].id);
  });
});
