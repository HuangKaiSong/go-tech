import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMobileHandoffRedis } from '@/lib/auth/mobile-handoff-redis';
import { decrypt, encrypt } from '@/lib/auth/session';
const mocks = vi.hoisted(() => ({
  secret: 'first-session-key-'.repeat(4),
  redisUrl: 'redis://first',
  clients: [] as { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; url: string }[]
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/runtime-config/service', () => ({
  infrastructureValue: (key: string) => (key === 'REDIS_URL' ? mocks.redisUrl : mocks.secret)
}));
vi.mock('ioredis', () => ({
  default: class {
    status = 'wait';
    disconnect = vi.fn();
    connect = vi.fn(async () => {
      this.status = 'ready';
    });
    on = vi.fn();
    constructor(url: string) {
      mocks.clients.push({ url, disconnect: this.disconnect, connect: this.connect });
    }
  }
}));
afterEach(() => {
  const state = globalThis as typeof globalThis & { pmsHandoffRedis?: unknown };
  delete state.pmsHandoffRedis;
  vi.unstubAllGlobals();
  mocks.clients.splice(0);
  mocks.redisUrl = 'redis://first';
  mocks.secret = 'first-session-key-'.repeat(4);
});
describe('infrastructure switching', () => {
  it('uses new session keys immediately and rejects previously signed sessions', async () => {
    vi.stubGlobal('Uint8Array', new TextEncoder().encode('').constructor);
    const old = await encrypt({ userId: '1', expiresAt: new Date(Date.now() + 60000) });
    expect((await decrypt(old))?.userId).toBe('1');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const info = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.secret = 'second-session-key-'.repeat(4);
    expect(await decrypt(old)).toBeUndefined();
    const fresh = await encrypt({ userId: '2', expiresAt: new Date(Date.now() + 60000) });
    expect((await decrypt(fresh))?.userId).toBe('2');
    log.mockRestore();
    info.mockRestore();
  });
  it('reuses a Redis connection and replaces it when the runtime URL changes', async () => {
    const first = await getMobileHandoffRedis();
    expect(await getMobileHandoffRedis()).toBe(first);
    expect(mocks.clients).toHaveLength(1);
    mocks.redisUrl = 'redis://second';
    expect(await getMobileHandoffRedis()).not.toBe(first);
    expect(mocks.clients[0]?.disconnect).toHaveBeenCalledOnce();
    expect(mocks.clients[1]?.url).toBe('redis://second');
  });
});
