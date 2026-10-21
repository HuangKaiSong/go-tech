import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/runtime-config/events/route';
import { refreshPublicConfig } from './events';
const mocks = vi.hoisted(() => ({ publicSnapshot: vi.fn() }));
vi.mock('@/db', () => ({ withRuntimeScope: (handler: (...args: unknown[]) => unknown) => handler }));
vi.mock('./service', () => ({ publicSnapshot: mocks.publicSnapshot }));
vi.mock('@/lib/runtime-config/server', () => ({ publicSnapshot: mocks.publicSnapshot }));
beforeEach(() => {
  vi.useFakeTimers();
  mocks.publicSnapshot.mockResolvedValue({ version: '1:db:1', values: { NEXT_PUBLIC_KPAY_ENABLE: 'false' } });
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
describe('runtime configuration SSE lifecycle', () => {
  it('sends initial state, pushes changes and stops timers on cancellation', async () => {
    const response = await GET(new Request('https://example.com/api/runtime-config/events'));
    expect(response.headers.get('x-accel-buffering')).toBe('no');
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    expect(new TextDecoder().decode((await reader?.read())?.value)).toContain('1:db:1');
    mocks.publicSnapshot.mockResolvedValue({ version: '2:other-db:0', values: { NEXT_PUBLIC_KPAY_ENABLE: 'true' } });
    await refreshPublicConfig();
    expect(new TextDecoder().decode((await reader?.read())?.value)).toContain('2:other-db:0');
    await reader?.cancel();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('retains the last state on storage failure, sends heartbeats and closes on abort', async () => {
    const controller = new AbortController();
    const response = await GET(
      new Request('https://example.com/api/runtime-config/events', { signal: controller.signal })
    );
    const reader = response.body?.getReader();
    await reader?.read();
    mocks.publicSnapshot.mockRejectedValue(new Error('storage unavailable'));
    await vi.advanceTimersByTimeAsync(15000);
    expect(new TextDecoder().decode((await reader?.read())?.value)).toContain(': heartbeat');
    controller.abort();
    expect((await reader?.read())?.done).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
