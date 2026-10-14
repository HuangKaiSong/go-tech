import { type MonitorReport } from '@go-tech/monitor-contract';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadReportChunks } from '../src/chunk-upload';
import {
  type QueuedReport,
  ReportDeliveryError,
  type ReportQueue,
  type ReportQueueStore,
  createReportQueue
} from '../src/report-queue';

function report(): MonitorReport {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    kind: 'performance',
    metrics: [],
    hasError: false,
    context: {
      app: 'web-h5',
      sessionId: crypto.randomUUID(),
      pageId: crypto.randomUUID(),
      path: '/',
      release: 'test',
      language: 'zh',
      userAgent: 'test',
      viewport: { width: 1, height: 1 },
      authentication: { status: 'verified', token: 'must-not-persist', cookie: 'must-not-persist' }
    }
  };
}
function storage() {
  const rows = new Map<string, QueuedReport>();
  const store: ReportQueueStore = {
    list: async () => structuredClone([...rows.values()]),
    put: async entry => {
      rows.set(entry.id, structuredClone(entry));
    },
    remove: async id => {
      rows.delete(id);
    }
  };
  return { rows, store };
}
const denied = async () => {
  throw new Error('SecurityError');
};
const queues: ReportQueue[] = [];
function queue(...args: Parameters<typeof createReportQueue>) {
  const value = createReportQueue(...args);
  queues.push(value);
  return value;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => {
  queues.forEach(value => value.stop());
  queues.length = 0;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('delivery simulations', () => {
  it('persists before delivery, strips credentials and deletes only after acknowledgement', async () => {
    const { rows, store } = storage();
    const item = report();
    let acknowledge: (() => void) | undefined;
    const send = vi.fn(async () => {
      expect(rows.has(item.id)).toBe(true);
      await new Promise<void>(resolve => {
        acknowledge = resolve;
      });
    });
    const outbox = queue(send, store);
    outbox.enqueue(item);
    await vi.advanceTimersByTimeAsync(1);
    expect(JSON.stringify([...rows.values()])).not.toContain('must-not-persist');
    expect(rows.has(item.id)).toBe(true);
    acknowledge?.();
    await vi.advanceTimersByTimeAsync(1);
    expect(rows.size).toBe(0);
  });
  it('retries weak-network failures with the same UUID and exponential backoff', async () => {
    const { rows, store } = storage();
    const item = report();
    const times: number[] = [];
    const send = vi.fn(async (_report: MonitorReport) => {
      times.push(Date.now());
      if (times.length < 3) throw new TypeError('offline');
    });
    queue(send, store).enqueue(item);
    await vi.advanceTimersByTimeAsync(10000);
    expect(send).toHaveBeenCalledTimes(3);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(2000);
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(4000);
    expect(send.mock.calls.every(args => args[0]?.id === item.id)).toBe(true);
    expect(rows.size).toBe(0);
  });
  it('keeps offline reports across page instances and resumes on online', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { rows, store } = storage();
    const send = vi.fn(async () => {});
    const first = queue(send, store);
    first.enqueue(report());
    await vi.advanceTimersByTimeAsync(100);
    expect(send).not.toHaveBeenCalled();
    expect(rows.size).toBe(1);
    first.stop();
    queue(send, store);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(100);
    expect(send).toHaveBeenCalledTimes(1);
    expect(rows.size).toBe(0);
  });
  it('recovers a persisted clip checkpoint after termination before its finalize timer', async () => {
    const { rows, store } = storage();
    const item = report();
    const send = vi.fn(async () => {});
    const first = queue(send, store);
    first.enqueue(item, Date.now() + 65000);
    await vi.advanceTimersByTimeAsync(1);
    first.stop();
    expect(rows.has(item.id)).toBe(true);
    queue(send, store);
    await vi.advanceTimersByTimeAsync(66000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(rows.size).toBe(0);
  });
  it('keeps more than four reports and drains with one in-flight upload', async () => {
    const { rows, store } = storage();
    let active = 0;
    let maximum = 0;
    const send = vi.fn(async () => {
      maximum = Math.max(maximum, (active += 1));
      await new Promise(resolve => {
        setTimeout(resolve, 50);
      });
      active -= 1;
    });
    const outbox = queue(send, store);
    for (let i = 0; i < 10; i += 1) outbox.enqueue(report());
    await vi.advanceTimersByTimeAsync(25000);
    expect(send).toHaveBeenCalledTimes(10);
    expect(maximum).toBe(1);
    expect(rows.size).toBe(0);
  });
  it('respects Retry-After and removes non-retryable invalid reports', async () => {
    const { rows, store } = storage();
    const send = vi.fn(async () => {
      throw new ReportDeliveryError(true, 60000);
    });
    const first = queue(send, store);
    first.enqueue(report());
    await vi.advanceTimersByTimeAsync(59000);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(send).toHaveBeenCalledTimes(2);
    first.stop();
    rows.clear();
    const invalid = vi.fn(async () => {
      throw new ReportDeliveryError(false);
    });
    queue(invalid, store).enqueue(report());
    await vi.advanceTimersByTimeAsync(10000);
    expect(invalid).toHaveBeenCalledTimes(1);
    expect(rows.size).toBe(0);
  });
  it('expires reports after 24 hours and never uploads expired data', async () => {
    const { rows, store } = storage();
    const item = report();
    item.timestamp -= 86400001;
    const send = vi.fn(async () => {});
    queue(send, store).enqueue(item);
    await vi.advanceTimersByTimeAsync(2000);
    expect(send).not.toHaveBeenCalled();
    expect(rows.size).toBe(0);
  });
  it('falls back to bounded memory if browser storage is denied', async () => {
    const send = vi.fn(async () => {});
    const outbox = queue(send, { list: denied, put: denied, remove: denied });
    for (let i = 0; i < 60; i += 1) outbox.enqueue(report());
    await vi.advanceTimersByTimeAsync(110000);
    expect(send.mock.calls.length).toBeLessThanOrEqual(50);
    expect(send.mock.calls.length).toBeGreaterThan(0);
  });
  it('persists chunk progress and resumes instead of resending acknowledged chunks', async () => {
    const item = report();
    item.context.userAgent = 'x'.repeat(40000);
    const progress = { index: 0, uploadId: '' };
    const seen: number[] = [];
    let failed = false;
    const send = vi.fn(async chunk => {
      seen.push(chunk.index);
      if (chunk.index === 1 && !failed) {
        failed = true;
        throw new Error('connection dropped');
      }
      return { complete: chunk.index === chunk.total - 1, nextIndex: chunk.index + 1 };
    });
    const save = vi.fn(async () => {});
    await expect(uploadReportChunks(item, progress, { send, checkpoint: save })).rejects.toThrow('connection dropped');
    expect(progress.index).toBe(1);
    const id = progress.uploadId;
    await uploadReportChunks(item, progress, { send, checkpoint: save });
    expect(progress.uploadId).toBe(id);
    expect(seen).toEqual([0, 1, 1, 2, 3]);
    expect(save).toHaveBeenCalled();
  });
});
