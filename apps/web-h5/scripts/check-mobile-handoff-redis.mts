import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { getMobileHandoffRedis } from '../lib/auth/mobile-handoff-redis';
import { createMobileHandoffStore } from '../lib/auth/mobile-handoff-store';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });

let client: Awaited<ReturnType<typeof getMobileHandoffRedis>> | undefined;
let key: string | undefined;
try {
  client = await getMobileHandoffRedis();
  assert.equal(await client.ping(), 'PONG');
  const store = createMobileHandoffStore();
  const authorization = `Bearer integration-test-only-${'t'.repeat(12_000)}`;
  const code = await store.issue(authorization, 'https://mobile.example');
  key = `go-tech:pms-mobile-handoff:v1:${createHash('sha256').update(code).digest('hex')}`;
  const ttl = await client.ttl(key);
  assert.ok(ttl > 0 && ttl <= 60);
  assert.ok(!(await client.get(key))?.includes(authorization));
  const results = await Promise.all(Array.from({ length: 20 }, () => store.consume(code, 'https://mobile.example')));
  assert.equal(results.filter(value => value === authorization).length, 1);
  assert.equal(results.filter(value => value === null).length, 19);
  assert.equal(await client.exists(key), 0);
  console.log('Redis 连接、凭证加密、TTL 及 20 个并发一次性兑换检查通过。');
} catch {
  console.error('Redis 联调失败，请检查连接配置、网络可达性、权限及 SESSION_SECRET。');
  process.exitCode = 1;
} finally {
  if (client && key) await client.del(key).catch(() => {});
  client?.disconnect();
}
