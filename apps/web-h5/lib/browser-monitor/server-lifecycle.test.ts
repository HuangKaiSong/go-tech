import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestError } from '@/instrumentation';
import { captureServerError } from './server';
import { sendServerErrorReport } from './server-report';

const { after, incomingHeaders } = vi.hoisted(() => ({
  after: vi.fn(),
  incomingHeaders: new Headers({ 'x-go-tech-pathname': '/feedback', 'user-agent': 'test-device' })
}));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => incomingHeaders }));
vi.mock('next/server', () => ({ after }));
vi.mock('./server-report', () => ({ sendServerErrorReport: vi.fn(async () => {}) }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('server monitoring lifecycle', () => {
  it('captures a handled failure immediately and uploads after the friendly response', async () => {
    vi.stubEnv('BROWSER_MONITOR_SERVICE_URL', 'http://localhost:8200');
    vi.stubEnv('BROWSER_MONITOR_INGEST_TOKEN', 'test-ingest');
    vi.useFakeTimers();
    vi.setSystemTime(10000);
    const error = new Error('handled failure');
    await captureServerError(error);
    expect(sendServerErrorReport).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalledOnce();
    vi.setSystemTime(15000);
    await after.mock.calls[0][0]();
    expect(sendServerErrorReport).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ path: '/feedback', method: 'GET' }),
      expect.objectContaining({ timestamp: 10000 })
    );
  });
  it('reports unhandled Next errors directly with their original request and route context', async () => {
    const error = Object.assign(new Error('server failed'), { digest: 'test-digest' });
    await onRequestError(
      error,
      { method: 'POST', path: '/api/feedback/features?private=hidden', headers: { 'user-agent': 'test-device' } },
      {
        routerKind: 'App Router',
        routePath: '/api/feedback/features',
        routeType: 'route',
        revalidateReason: undefined
      }
    );
    expect(sendServerErrorReport).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ method: 'POST', routeType: 'route', routePath: '/api/feedback/features' }),
      expect.objectContaining({ timestamp: expect.any(Number) })
    );
    expect(after).not.toHaveBeenCalled();
  });
});
