import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { type MobileHandoffRedis, createMobileHandoffStore } from './mobile-handoff-store';

const originalSecret = process.env.SESSION_SECRET;

beforeEach(() => {
  process.env.SESSION_SECRET = 'unit-test-secret-only';
});
afterEach(() => {
  mock.restoreAll();
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
});

function setup() {
  const entries = new Map<string, { expiresAt: number; value: string }>();
  const redis: MobileHandoffRedis = {
    async set(key, value, ...options) {
      const [expiry, seconds, condition] = options;
      assert.equal(expiry, 'EX');
      assert.equal(seconds, 60);
      assert.equal(condition, 'NX');
      if (entries.has(key)) return null;
      entries.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
      return 'OK';
    },
    async eval(script, numberOfKeys, key) {
      assert.equal(numberOfKeys, 1);
      assert.ok(script.includes("redis.call('GET', KEYS[1])"));
      assert.ok(script.includes("redis.call('DEL', KEYS[1])"));
      const entry = entries.get(key);
      entries.delete(key);
      return entry && entry.expiresAt > Date.now() ? entry.value : null;
    }
  };
  return { entries, redis, store: createMobileHandoffStore(async () => redis) };
}

test('长凭证加密保存，code 仅存摘要，并使用 Redis 60 秒过期', async () => {
  const { entries, store } = setup();
  const authorization = `Bearer ${'t'.repeat(12_000)}`;
  const code = await store.issue(authorization, 'https://mobile.example');
  assert.match(code, /^[A-Za-z0-9_-]{43}$/);
  const [key, entry] = [...entries.entries()][0];
  assert.match(key, /^go-tech:pms-mobile-handoff:v1:[a-f0-9]{64}$/);
  assert.ok(!key.includes(code));
  assert.ok(!entry.value.includes(authorization));
  assert.equal(await store.consume(code, 'https://mobile.example'), authorization);
  assert.equal(entries.size, 0);
  assert.equal(await store.consume(code, 'https://mobile.example'), null);
});

test('两个独立 store 共用 Redis，并发时仅一个请求兑换成功', async () => {
  const { redis, store } = setup();
  const second = createMobileHandoffStore(async () => redis);
  const code = await store.issue('Bearer test-token', 'https://mobile.example');
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) => (i % 2 ? store : second).consume(code, 'https://mobile.example'))
  );
  assert.equal(results.filter(value => value === 'Bearer test-token').length, 1);
  assert.equal(results.filter(value => value === null).length, 19);
});

test('Redis 或凭证有效期到达 60 秒时不返回凭证', async () => {
  const { entries, store } = setup();
  const now = Date.now();
  mock.method(Date, 'now', () => now);
  const code = await store.issue('Bearer expired-token', 'https://mobile.example');
  const [entry] = entries.values();
  // 模拟 Redis 尚未主动清理：密文中的 expiresAt 仍会拒绝过期凭证。
  entry.expiresAt = now + 120_000;
  mock.method(Date, 'now', () => now + 60_000);
  assert.equal(await store.consume(code, 'https://mobile.example'), null);
  const fresh = await store.issue('Bearer fresh-token', 'https://mobile.example');
  mock.method(Date, 'now', () => now + 120_000);
  assert.equal(await store.consume(fresh, 'https://mobile.example'), null);
});

test('错误 audience 或被篡改的密文不返回凭证', async () => {
  const { entries, store } = setup();
  const wrongAudience = await store.issue('Bearer test-token', 'https://mobile.example');
  assert.equal(await store.consume(wrongAudience, 'https://evil.example'), null);
  const code = await store.issue('Bearer test-token', 'https://mobile.example');
  const [entry] = entries.values();
  entry.value = 'invalid-ciphertext';
  await assert.rejects(store.consume(code, 'https://mobile.example'));
  assert.equal(entries.size, 0);
});

test('未配置密钥时不写入 Redis；Redis 错误和冲突不会假装签发成功', async () => {
  const { entries, store } = setup();
  delete process.env.SESSION_SECRET;
  await assert.rejects(store.issue('Bearer token', 'https://mobile.example'));
  assert.equal(entries.size, 0);
  process.env.SESSION_SECRET = 'unit-test-secret-only';
  const failed = createMobileHandoffStore(async () => {
    throw new Error('connection failed');
  });
  await assert.rejects(failed.issue('Bearer token', 'https://mobile.example'));
  await assert.rejects(failed.consume('unknown-code', 'https://mobile.example'));
  const collision = createMobileHandoffStore(async () => ({
    async eval() {
      return null;
    },
    async set() {
      return null;
    }
  }));
  await assert.rejects(collision.issue('Bearer token', 'https://mobile.example'));
});
