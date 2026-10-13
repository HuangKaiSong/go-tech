import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MonitorReport } from '@go-tech/monitor-contract';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportStore } from '../src/store';

vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, unlink: vi.fn(actual.unlink) };
});

const directories: string[] = [];
afterEach(async () => {
  vi.useRealTimers();
  vi.mocked(unlink).mockReset();
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  vi.mocked(unlink).mockImplementation(actual.unlink);
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

function report(): MonitorReport {
  return {
    schemaVersion: 1,
    id: randomUUID(),
    timestamp: Date.now(),
    kind: 'performance',
    hasError: false,
    metrics: [],
    context: {
      app: 'web-h5',
      sessionId: randomUUID(),
      pageId: randomUUID(),
      path: '/feedback',
      release: 'test',
      userAgent: 'test',
      language: 'en',
      viewport: { width: 100, height: 100 }
    }
  };
}

async function directory() {
  const value = await mkdtemp(join(tmpdir(), 'monitor-store-'));
  directories.push(value);
  return value;
}

async function failReportDeletion() {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  vi.mocked(unlink).mockImplementation(async path => {
    if (String(path).endsWith('.json')) throw Object.assign(new Error('File deletion denied'), { code: 'EACCES' });
    return actual.unlink(path);
  });
}

describe('bounded report summary index', () => {
  it('keeps the memory cap during prolonged writes, even when every report deletion fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10000);
    const path = await directory();
    const store = new ReportStore(path, 86400000, 3);
    await store.initialize();
    await failReportDeletion();
    for (let index = 0; index < 20; index += 1) {
      vi.setSystemTime(10000 + index);
      // oxlint-disable-next-line no-await-in-loop -- Observe the index invariant after each serialized save.
      await store.save(report()).catch(() => {});
      expect(store).toHaveProperty('summaries.size', Math.min(index + 1, 3));
    }
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    vi.mocked(unlink).mockImplementation(actual.unlink);
    await store.prune();
    expect(await readdir(path)).toHaveLength(3);
    expect(store.list({ limit: 10 }).items).toHaveLength(3);
  });

  it('bounds the index throughout startup and keeps the newest reports regardless of file order', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10000);
    const path = await directory();
    const reports = Array.from({ length: 20 }, () => report());
    await Promise.all(
      reports.map((value, index) =>
        writeFile(join(path, `${value.id}.json`), JSON.stringify({ report: value, receivedAt: 9000 + index }))
      )
    );
    const observedSizes: number[] = [];
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    const store = new ReportStore(path, 86400000, 3);
    vi.mocked(unlink).mockImplementation(async value => {
      // Every deletion is an asynchronous boundary during startup; the index must already be bounded.
      observedSizes.push(store.list({ limit: 100 }).items.length);
      expect(store).toHaveProperty('summaries.size', 3);
      return actual.unlink(value);
    });
    await store.initialize();
    expect(observedSizes).toHaveLength(17);
    expect(Math.max(...observedSizes)).toBe(3);
    expect(store.list({ limit: 10 }).items.map(item => item.id)).toEqual(
      reports
        .slice(-3)
        .toReversed()
        .map(item => item.id)
    );
    expect(await readdir(path)).toHaveLength(3);
  });

  it('evicts expired summaries before disk cleanup and retries failed cleanup without an in-memory backlog', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10000);
    const path = await directory();
    const store = new ReportStore(path, 10, 3);
    await store.initialize();
    const value = report();
    await store.save(value);
    vi.setSystemTime(10011);
    await failReportDeletion();
    await expect(store.prune()).rejects.toThrow('File deletion denied');
    expect(store).toHaveProperty('summaries.size', 0);
    expect(await readFile(join(path, `${value.id}.json`), 'utf8')).toBeTruthy();
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    vi.mocked(unlink).mockImplementation(actual.unlink);
    await store.prune();
    expect(await readdir(path)).toHaveLength(0);
  });

  it('rejects an unbounded capacity or invalid retention before loading files', () => {
    for (const capacity of [0, -1, Infinity, Number.NaN, 1.5])
      expect(() => new ReportStore('/unused', 1000, capacity)).toThrow('Invalid maxReports');
    expect(() => new ReportStore('/unused', Infinity, 3)).toThrow('Invalid retentionMs');
  });
});
