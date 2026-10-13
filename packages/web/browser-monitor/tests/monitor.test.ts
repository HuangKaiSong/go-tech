import { type MonitorReport, reportSchema } from '@go-tech/monitor-contract';
import { record } from '@rrweb/record';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onFCP } from 'web-vitals';
import { startBrowserMonitor } from '../src/index';
import { sanitizeRecording } from '../src/privacy';
import { ReplayBuffer } from '../src/replay-buffer';

vi.mock('@rrweb/record', () => ({
  record: Object.assign(
    vi.fn(() => vi.fn()),
    { takeFullSnapshot: vi.fn() }
  )
}));
vi.mock('web-vitals', () => ({ onCLS: vi.fn(), onFCP: vi.fn(), onINP: vi.fn(), onLCP: vi.fn(), onTTFB: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.mocked(record.takeFullSnapshot).mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('browser monitor', () => {
  it('reports React client errors with replay and never attaches replay to server errors', async () => {
    vi.useFakeTimers();
    const reports: MonitorReport[] = [];
    const monitor = startBrowserMonitor({
      transport: async report => {
        reports.push(report);
      },
      postErrorMs: 100
    });
    try {
      const options = vi.mocked(record).mock.calls.at(-1)?.[0];
      options?.emit?.({
        type: 2,
        timestamp: Date.now(),
        data: { node: { type: 0, id: 1, childNodes: [] }, initialOffset: { top: 0, left: 0 } }
      });
      monitor.captureError(new Error('React failed'), { kind: 'react-client' });
      monitor.captureError(new Error('Server failed'), { kind: 'next-server' });
      await vi.advanceTimersByTimeAsync(100);
      const server = reports.find(report => report.kind === 'error' && report.error.kind === 'next-server');
      const client = reports.find(report => report.kind === 'error' && report.error.kind === 'react-client');
      if (server?.kind !== 'error' || client?.kind !== 'error') throw new Error('Missing error reports');
      expect(server.replay).toEqual({ events: [], unavailableReason: 'server-error' });
      expect(client.replay.events.length).toBeGreaterThan(0);
      expect(client.timeSource).toBe('client');
      expect(client.context.device?.timezone).toBeTruthy();
    } finally {
      monitor.stop();
    }
  });
  it('uploads valid error and performance reports on LAN HTTP without randomUUID', async () => {
    vi.useFakeTimers();
    sessionStorage.clear();
    const randomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    vi.stubGlobal('crypto', { getRandomValues: randomValues });
    const reports: MonitorReport[] = [];
    const monitor = startBrowserMonitor({
      transport: async value => {
        reports.push(value);
      }
    });
    try {
      monitor.captureError(new Error('LAN HTTP test'));
      const callback = vi.mocked(onFCP).mock.calls.at(-1)?.[0];
      callback?.({
        id: 'fcp-lan',
        name: 'FCP',
        value: 100,
        delta: 100,
        rating: 'good',
        navigationType: 'navigate',
        navigationId: 1,
        entries: []
      });
      await vi.advanceTimersByTimeAsync(15000);
      expect(reports.map(report => report.kind)).toEqual(['error', 'performance']);
      for (const report of reports) expect(reportSchema.safeParse(report).success).toBe(true);
      expect(reports[0].id).not.toBe(reports[1].id);
    } finally {
      monitor.stop();
    }
  });
  it('retains base snapshots when old events or excessive buffers are evicted', () => {
    const buffer = new ReplayBuffer(100, 1000);
    buffer.add({ type: 4, timestamp: 0, data: {} });
    buffer.add({ type: 2, timestamp: 0, data: {} });
    buffer.add({ type: 3, timestamp: 10, data: {} });
    buffer.add({ type: 2, timestamp: 100, data: {} });
    buffer.add({ type: 3, timestamp: 210, data: {} });
    expect(buffer.snapshot().some(event => event.type === 2 && event.timestamp === 0)).toBe(false);
    expect(buffer.snapshot().some(event => event.type === 2 && event.timestamp === 100)).toBe(true);
    buffer.add({ type: 3, timestamp: 220, data: { text: 'x'.repeat(2000) } });
    expect(buffer.snapshot()).toEqual([]);
    buffer.add({ type: 3, timestamp: 230, data: {} });
    expect(buffer.snapshot()).toEqual([]);
    buffer.add({ type: 2, timestamp: 240, data: {} });
    expect(buffer.snapshot().some(event => event.type === 2)).toBe(true);
  });
  it('filters DOM attributes, URL queries and input values while keeping CSS', () => {
    const result = sanitizeRecording({
      type: 2,
      timestamp: 1,
      data: {
        href: 'https://example.com/en?token=secret#password',
        text: 'private input',
        attributes: {
          class: 'button',
          style: 'color:red;background:url(/img?token=secret)',
          'data-token': 'secret',
          value: 'secret',
          href: '/?token=secret',
          _cssText: '.button{color:red}'
        }
      }
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('private input');
    expect(serialized).toContain('.button{color:red}');
    const mutation = sanitizeRecording({
      type: 3,
      timestamp: 2,
      data: {
        source: 0,
        attributes: [{ id: 10, attributes: { style: 'padding:12px', 'data-token': 'secret' } }]
      }
    });
    expect(JSON.stringify(mutation)).toContain('padding:12px');
    expect(JSON.stringify(mutation)).not.toContain('secret');
    const declaration = sanitizeRecording({
      type: 3,
      timestamp: 3,
      data: {
        source: 13,
        set: { property: 'content', value: '"private content"', priority: '' }
      }
    });
    expect(JSON.stringify(declaration)).not.toContain('private content');
    const text = sanitizeRecording({
      type: 2,
      timestamp: 4,
      data: {
        node: { textContent: '登入帳號 contact@example.com token=secret' },
        attributes: { placeholder: '請輸入帳號', 'aria-label': '登入', value: 'private input' }
      }
    });
    expect(JSON.stringify(text)).toContain('登入帳號');
    expect(JSON.stringify(text)).toContain('請輸入帳號');
    expect(JSON.stringify(text)).not.toContain('contact@example.com');
    expect(JSON.stringify(text)).not.toContain('secret');
    expect(JSON.stringify(text)).not.toContain('private input');
    const changedText = sanitizeRecording({
      type: 3,
      timestamp: 5,
      data: { source: 0, texts: [{ id: 10, value: '登入成功 contact@example.com token=secret' }] }
    });
    expect(JSON.stringify(changedText)).toContain('登入成功');
    expect(JSON.stringify(changedText)).not.toContain('contact@example.com');
    expect(JSON.stringify(changedText)).not.toContain('secret');
  });
  it('retains bounded CSS presentation attributes in snapshots and mode changes', () => {
    const snapshot = sanitizeRecording({
      type: 2,
      timestamp: 1,
      data: {
        node: {
          attributes: {
            'data-view-frame': '',
            'data-view-mode': 'mobile',
            'data-view-scroll-root': '',
            'data-view-portal-root': '',
            'data-state': 'open',
            'data-side': 'right',
            dir: 'ltr',
            lang: 'zh-HK',
            'data-token': 'secret',
            'data-user-id': 'private',
            'data-align': 'secret'
          }
        }
      }
    });
    expect(snapshot.data).toEqual({
      node: {
        attributes: {
          'data-view-frame': '',
          'data-view-mode': 'mobile',
          'data-view-scroll-root': '',
          'data-view-portal-root': '',
          'data-state': 'open',
          'data-side': 'right',
          dir: 'ltr',
          lang: 'zh-HK'
        }
      }
    });
    const mutation = sanitizeRecording({
      type: 3,
      timestamp: 2,
      data: {
        source: 0,
        attributes: [
          {
            id: 10,
            attributes: {
              'data-view-mode': 'pc',
              'data-state': null,
              'data-user-id': 'private',
              lang: 'token=secret'
            }
          }
        ]
      }
    });
    expect(mutation.data).toEqual({
      source: 0,
      attributes: [
        {
          id: 10,
          attributes: {
            'data-view-mode': 'pc',
            'data-state': null
          }
        }
      ]
    });
    expect(JSON.stringify(snapshot)).not.toContain('secret');
    expect(JSON.stringify(mutation)).not.toContain('private');
  });
  it('captures errors with pre/post snapshots, deduplicates and stops listeners', async () => {
    vi.useFakeTimers();
    const reports: MonitorReport[] = [];
    const monitor = startBrowserMonitor({
      transport: async value => {
        reports.push(value);
      },
      postErrorMs: 100
    });
    const options = vi.mocked(record).mock.calls.at(-1)?.[0];
    options?.emit?.({
      type: 4,
      timestamp: Date.now(),
      data: { href: 'https://example.com/en?token=secret', width: 100, height: 100 }
    });
    options?.emit?.({
      type: 2,
      timestamp: Date.now(),
      data: { node: { type: 0, id: 1, childNodes: [] }, initialOffset: { top: 0, left: 0 } }
    });
    monitor.navigation('/en/profile?token=secret');
    const error = new Error('failed at https://example.com/api?token=secret');
    monitor.captureError(error);
    monitor.captureError(error);
    options?.emit?.({ type: 3, timestamp: Date.now() + 50, data: { source: 3, id: 1, x: 0, y: 10 } });
    await vi.advanceTimersByTimeAsync(100);
    expect(reports).toHaveLength(1);
    expect(reportSchema.safeParse(reports[0]).success).toBe(true);
    expect(JSON.stringify(reports[0])).not.toContain('secret');
    const first = reports[0];
    if (first.kind !== 'error') throw new Error('Expected error report');
    expect(first.replay.events.map(event => event.type)).toEqual([4, 2, 3, 5]);
    const remove = vi.spyOn(window, 'removeEventListener');
    monitor.stop();
    expect(remove.mock.calls.some(([name]) => name === 'error')).toBe(true);
    expect(remove.mock.calls.some(([name]) => name === 'unhandledrejection')).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(reports).toHaveLength(1);
  });
  it('bounds a quiet recording and preserves its post-error duration without DOM changes', async () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const reports: MonitorReport[] = [];
    const monitor = startBrowserMonitor({
      transport: async report => {
        reports.push(report);
      }
    });
    try {
      const options = vi.mocked(record).mock.calls.at(-1)?.[0];
      const snapshot = () => {
        options?.emit?.({ type: 4, timestamp: Date.now(), data: { href: '/', width: 375, height: 812 } });
        options?.emit?.({
          type: 2,
          timestamp: Date.now(),
          data: { node: { type: 0, id: 1, childNodes: [] }, initialOffset: { top: 0, left: 0 } }
        });
      };
      vi.mocked(record.takeFullSnapshot).mockImplementation(snapshot);
      snapshot();
      await vi.advanceTimersByTimeAsync(170000);
      const errorAt = Date.now();
      monitor.captureError(new Error('quiet error'));
      await vi.advanceTimersByTimeAsync(5000);
      const report = reports.find(value => value.kind === 'error');
      if (!report || report.kind !== 'error') throw new Error('Missing error report');
      expect(report.replay.events[0].timestamp).toBeGreaterThanOrEqual(errorAt - 60000);
      expect(report.replay.events.at(-1)?.timestamp).toBe(errorAt + 5000);
      expect(report.replay.events.at(-1)?.type).toBe(5);
      expect(reportSchema.safeParse(report).success).toBe(true);
    } finally {
      monitor.stop();
    }
    expect(vi.getTimerCount()).toBe(0);
  });
  it('reports Web Vitals without errors and isolates transport failure', async () => {
    vi.useFakeTimers();
    const reports: MonitorReport[] = [];
    const monitor = startBrowserMonitor({
      transport: async value => {
        reports.push(value);
        throw new Error('transport');
      }
    });
    const callback = vi.mocked(onFCP).mock.calls.at(-1)?.[0];
    callback?.({
      id: 'fcp-test',
      name: 'FCP',
      value: 300,
      delta: 300,
      rating: 'good',
      navigationType: 'navigate',
      navigationId: 1,
      entries: []
    });
    await vi.advanceTimersByTimeAsync(15000);
    expect(reports).toHaveLength(1);
    expect(reports[0].kind).toBe('performance');
    expect(reportSchema.safeParse(reports[0]).success).toBe(true);
    monitor.captureError(new DOMException('Cancelled', 'AbortError'));
    await vi.advanceTimersByTimeAsync(15000);
    expect(reports).toHaveLength(1);
    monitor.stop();
  });
});
