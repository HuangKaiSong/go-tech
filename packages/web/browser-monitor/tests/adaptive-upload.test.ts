import { type MonitorReport, type ReportChunk, reportChunkSchema } from '@go-tech/monitor-contract';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type MonitorUploadOptions,
  type UploadNetworkState,
  createAdaptiveReportTransport
} from '../src/adaptive-upload';
import { type ReportDeliveryContext, ReportDeliveryError } from '../src/report-queue';

function report(bytes = 600 * 1024): MonitorReport {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    kind: 'error',
    metrics: [],
    breadcrumbs: [],
    context: {
      app: 'web-h5',
      sessionId: crypto.randomUUID(),
      pageId: crypto.randomUUID(),
      path: '/',
      release: 'test',
      language: 'en',
      userAgent: 'test',
      viewport: { width: 1, height: 1 }
    },
    error: { kind: 'javascript', name: 'Error', message: 'adaptive' },
    replay: { events: [{ type: 2, timestamp: Date.now(), data: { text: 'x'.repeat(bytes) } }] }
  };
}
function delivery(): ReportDeliveryContext {
  return { recovered: false, progress: { index: 0, uploadId: '' }, checkpoint: vi.fn(async () => {}) };
}
function receiver(calls: Array<{ options: MonitorUploadOptions; value: MonitorReport | ReportChunk }>) {
  return async (value: MonitorReport | ReportChunk, options: MonitorUploadOptions) => {
    calls.push({ value, options });
    if ('protocol' in value) {
      expect(reportChunkSchema.safeParse(value).success).toBe(true);
      return { id: value.id, complete: value.index === value.total - 1, nextIndex: value.index + 1 };
    }
    return { id: value.id };
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('adaptive delivery', () => {
  it.each([{}, { effectiveType: '4g', downlink: 10 }])(
    'sends a 600 KiB replay once on fast/unknown networks: %j',
    async state => {
      const calls: Parameters<typeof receiver>[0] = [];
      await createAdaptiveReportTransport(receiver(calls), () => state)(report(), delivery());
      expect(calls).toHaveLength(1);
      expect(calls[0].options.chunk).toBe(false);
    }
  );
  it.each([{ effectiveType: '2g' }, { effectiveType: '3g' }, { effectiveType: '4g', downlink: 0.5 }])(
    'chooses larger chunks for faster hints: %j',
    async state => {
      const calls: Parameters<typeof receiver>[0] = [];
      await createAdaptiveReportTransport(receiver(calls), () => state)(report(), delivery());
      expect(calls.every(call => call.options.chunk)).toBe(true);
      const first = calls[0].value;
      if (!('protocol' in first)) throw new Error('Expected chunks');
      const expected: Record<string, number> = { '2g': 16384, '3g': 98304, '4g': 49152 };
      expect(first.chunkBytes).toBe(expected[state.effectiveType]);
    }
  );
  it('uses one keepalive for a small hidden report and bounded chunks for a large hidden report', async () => {
    const calls: Parameters<typeof receiver>[0] = [];
    const upload = createAdaptiveReportTransport(receiver(calls), () => ({ hidden: true }));
    await upload(report(10000), delivery());
    expect(calls).toHaveLength(1);
    expect(calls[0].options.keepalive).toBe(true);
    calls.length = 0;
    await upload(report(), delivery());
    expect(calls.every(call => call.options.keepalive && call.options.chunk)).toBe(true);
  });
  it('falls back to chunks after an actual whole-request network failure', async () => {
    const calls: Parameters<typeof receiver>[0] = [];
    const ack = receiver(calls);
    let failed = false;
    const send = async (value: MonitorReport | ReportChunk, options: MonitorUploadOptions) => {
      if (!options.chunk && !failed) {
        failed = true;
        calls.push({ value, options });
        throw new ReportDeliveryError(true, 0, true);
      }
      return ack(value, options);
    };
    const context = delivery();
    await createAdaptiveReportTransport(send, () => ({}))(report(), context);
    expect(calls[0].options.chunk).toBe(false);
    expect(calls.slice(1).every(call => call.options.chunk)).toBe(true);
    expect(context.progress.forceChunks).toBe(true);
  });
  it('does not amplify service outages or rate limits into chunk uploads', async () => {
    const send = vi.fn(async () => {
      throw new ReportDeliveryError(true, 60000);
    });
    const context = delivery();
    await expect(createAdaptiveReportTransport(send, () => ({}))(report(), context)).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
    expect(context.progress.forceChunks).toBeUndefined();
  });
  it('halves failed chunk sizes with a fresh upload ID and persists changed boundaries', async () => {
    const context = delivery();
    const send = vi.fn(async () => {
      throw new ReportDeliveryError(true, 0, true);
    });
    await expect(
      createAdaptiveReportTransport(send, () => ({ effectiveType: '3g' }))(report(), context)
    ).rejects.toThrow();
    expect(context.progress).toMatchObject({ chunkBytes: 49152, index: 0, uploadId: '', forceChunks: true });
    expect(context.checkpoint).toHaveBeenCalled();
  });
  it('keeps existing upload boundaries and resumes from the saved index after the network changes', async () => {
    const calls: Parameters<typeof receiver>[0] = [];
    const context = delivery();
    context.progress = { chunkBytes: 65536, index: 2, uploadId: crypto.randomUUID() };
    await createAdaptiveReportTransport(receiver(calls), () => ({ effectiveType: '2g' }))(report(), context);
    expect(calls.every(call => 'protocol' in call.value && call.value.chunkBytes === 65536)).toBe(true);
    const first = calls[0].value;
    expect('index' in first && first.index).toBe(2);
  });
  it('encodes 256 KiB chunks without overflowing the JavaScript argument stack', async () => {
    const calls: Parameters<typeof receiver>[0] = [];
    const context = delivery();
    context.progress = { chunkBytes: 262144, index: 0, uploadId: crypto.randomUUID() };
    await createAdaptiveReportTransport(receiver(calls), () => ({}))(report(), context);
    expect(calls).toHaveLength(3);
  });
  it('does not infer a slow uplink from tiny performance requests', async () => {
    const calls: Parameters<typeof receiver>[0] = [];
    const upload = createAdaptiveReportTransport(receiver(calls), () => ({ effectiveType: '4g', downlink: 10 }));
    await upload(report(100), delivery());
    calls.length = 0;
    await upload(report(), delivery());
    expect(calls).toHaveLength(1);
  });
  it('learns real transfer speed and invalidates the estimate on a network change', async () => {
    let state: UploadNetworkState = {};
    let clock = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    const calls: Parameters<typeof receiver>[0] = [];
    const ack = receiver(calls);
    const upload = createAdaptiveReportTransport(
      async (value, options) => {
        clock += 10000;
        return ack(value, options);
      },
      () => state
    );
    await upload(report(65536), delivery());
    calls.length = 0;
    await upload(report(), delivery());
    expect(calls.length).toBeGreaterThan(1);
    state = { effectiveType: '4g', downlink: 10 };
    calls.length = 0;
    await upload(report(), delivery());
    expect(calls).toHaveLength(1);
  });
  it('reads the browser connection hint without requiring Network Information support', async () => {
    vi.stubGlobal('navigator', { onLine: true, connection: { effectiveType: '3g', downlink: 0.5 } });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const calls: Parameters<typeof receiver>[0] = [];
    await createAdaptiveReportTransport(receiver(calls))(report(), delivery());
    const first = calls[0].value;
    expect('chunkBytes' in first && first.chunkBytes).toBe(98304);
  });
});
