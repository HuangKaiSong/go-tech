import { type MonitorReport, reportListResponseSchema } from '@go-tech/monitor-contract';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMonitorServer } from '../src/server';
import { type MonitorReportStore, summarize } from '../src/storage/report-store';
import { fixture } from './fixtures';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map(cleanup => cleanup()));
});
async function setup(maxInFlightUploads = 16) {
  const report = fixture();
  const receivedAt = Date.now();
  const store = {
    initialize: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    prune: vi.fn(async () => {}),
    save: vi.fn(async (value: MonitorReport) => ({ id: value.id, duplicate: false })),
    getStored: vi.fn(async () => ({ report, receivedAt })),
    list: vi.fn(async () => ({ items: [summarize(report, receivedAt)], nextCursor: null }))
  } satisfies MonitorReportStore;
  const server = createMonitorServer(store, { ingest: 'ingest-test', query: 'query-test' }, { maxInFlightUploads });
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
  if (!address || typeof address === 'string') throw new Error('Missing server address');
  return { store, report, receivedAt, url: `http://127.0.0.1:${address.port}` };
}
const ingestHeaders = { Authorization: 'Bearer ingest-test', 'Content-Type': 'application/json' };
const queryHeaders = { Authorization: 'Bearer query-test' };
describe('monitor HTTP protocol', () => {
  it('returns MySQL metadata, rejects the removed switch route, and separates tokens', async () => {
    const { url } = await setup();
    expect((await fetch(`${url}/health`)).status).toBe(200);
    expect((await fetch(`${url}/api/reports`)).status).toBe(401);
    expect((await fetch(`${url}/api/reports`, { headers: ingestHeaders })).status).toBe(401);
    const response = await fetch(`${url}/api/storage`, { headers: queryHeaders });
    expect(await response.json()).toEqual({ code: 200, data: { storage: 'mysql' } });
    expect((await fetch(`${url}/api/storage/switch`, { method: 'POST', headers: queryHeaders })).status).toBe(404);
  });
  it('returns safe summaries, consistent details and the raw replay protocol', async () => {
    const { receivedAt, report, url } = await setup();
    const list = reportListResponseSchema.parse(
      await (await fetch(`${url}/api/reports`, { headers: queryHeaders })).json()
    );
    expect(list.data.items[0].context.authentication).not.toHaveProperty('token');
    expect(list.data.items[0].context.authentication).not.toHaveProperty('cookie');
    const detail = await (await fetch(`${url}/api/reports/${report.id}`, { headers: queryHeaders })).json();
    expect(detail).toEqual({ code: 200, data: report, receivedAt });
    const replay = await fetch(`${url}/api/reports/${report.id}/replay`, { headers: queryHeaders });
    expect(await replay.json()).toEqual(report.kind === 'error' ? report.replay.events : []);
    expect(replay.headers.get('cache-control')).toBe('no-store');
  });
  it('rejects malformed and oversized reports before touching storage', async () => {
    const { store, url } = await setup();
    for (const [body, expected] of [
      ['{', 400],
      ['{}', 400],
      [JSON.stringify({ data: 'x'.repeat(4 * 1024 * 1024) }), 413]
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop -- Verify rejection status for each transport boundary.
      expect((await fetch(`${url}/api/reports`, { method: 'POST', headers: ingestHeaders, body })).status).toBe(
        expected
      );
    }
    expect(store.save).not.toHaveBeenCalled();
    expect((await fetch(`${url}/api/reports?limit=1000`, { headers: queryHeaders })).status).toBe(400);
  });
  it('does not acknowledge uploads or expose driver details when MySQL writes fail', async () => {
    const { report, store, url } = await setup();
    store.save.mockRejectedValue(new Error('private driver parameters'));
    const response = await fetch(`${url}/api/reports`, {
      method: 'POST',
      headers: ingestHeaders,
      body: JSON.stringify(report)
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ code: 500, message: 'Monitor service error' });
  });
  it('rejects overload before buffering another report body', async () => {
    const { report, store, url } = await setup(1);
    let release: (() => void) | undefined;
    let started: (() => void) | undefined;
    const blocked = new Promise<void>(resolve => {
      release = resolve;
    });
    const saving = new Promise<void>(resolve => {
      started = resolve;
    });
    store.save.mockImplementation(async value => {
      started?.();
      await blocked;
      return { id: value.id, duplicate: false };
    });
    const options = { method: 'POST', headers: ingestHeaders, body: JSON.stringify(report) };
    const first = fetch(`${url}/api/reports`, options);
    try {
      await saving;
      expect((await fetch(`${url}/api/reports`, options)).status).toBe(503);
    } finally {
      release?.();
    }
    expect((await first).status).toBe(201);
  });
  it('validates inclusive occurrence-time bounds before querying storage', async () => {
    const { store, url } = await setup();
    const response = await fetch(`${url}/api/reports?from=1000&to=2000`, { headers: queryHeaders });
    expect(response.status).toBe(200);
    expect(store.list).toHaveBeenLastCalledWith(expect.objectContaining({ from: 1000, to: 2000 }));
    for (const range of ['from=2000&to=1000', 'from=bad', 'from=-1', 'to=1.5', 'from=', 'to=99999999999999999999']) {
      // oxlint-disable-next-line no-await-in-loop -- Verify each invalid HTTP boundary is rejected before storage.
      expect((await fetch(`${url}/api/reports?${range}`, { headers: queryHeaders })).status).toBe(400);
    }
    expect(store.list).toHaveBeenCalledTimes(1);
    expect((await fetch(`${url}/api/reports?from=0`, { headers: queryHeaders })).status).toBe(200);
    expect((await fetch(`${url}/api/reports?to=2000`, { headers: queryHeaders })).status).toBe(200);
  });
});
