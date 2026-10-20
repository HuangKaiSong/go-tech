import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { MobileHandoffStore } from './mobile-handoff';
import { getMobileHandoffRedis } from './mobile-handoff-redis';

const lifetime = 60_000;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function encryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required');
  return createHash('sha256').update(`pms-mobile-handoff:${secret}`).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decrypt(value: string) {
  const bytes = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
}

export interface MobileHandoffRedis {
  eval: (script: string, numberOfKeys: number, ...args: string[]) => Promise<unknown>;
  set: (key: string, value: string, ...options: ['EX', number, 'NX']) => Promise<string | null>;
}

// 单次 Lua 调用完成读取和删除，兼容未提供 GETDEL 的 Redis 版本。
const consumeScript = `
local value = redis.call('GET', KEYS[1])
if value then redis.call('DEL', KEYS[1]) end
return value
`;
const keyFor = (code: string) => `go-tech:pms-mobile-handoff:v1:${hash(code)}`;

export function createMobileHandoffStore(
  getRedis: () => Promise<MobileHandoffRedis> = getMobileHandoffRedis
): MobileHandoffStore {
  return {
    async issue(authorization, audience) {
      const code = randomBytes(32).toString('base64url');
      const payload = encrypt(JSON.stringify({ authorization, audience, expiresAt: Date.now() + lifetime }));
      const redis = await getRedis();
      const saved = await redis.set(keyFor(code), payload, 'EX', lifetime / 1000, 'NX');
      if (saved !== 'OK') throw new Error('Unable to reserve handoff code');
      return code;
    },
    async consume(code, audience) {
      const redis = await getRedis();
      const value = await redis.eval(consumeScript, 1, keyFor(code));
      if (typeof value !== 'string') return null;
      const payload: unknown = JSON.parse(decrypt(value));
      if (
        !payload ||
        typeof payload !== 'object' ||
        !('expiresAt' in payload) ||
        typeof payload.expiresAt !== 'number' ||
        payload.expiresAt <= Date.now() ||
        !('audience' in payload) ||
        payload.audience !== audience ||
        !('authorization' in payload) ||
        typeof payload.authorization !== 'string'
      )
        return null;
      return payload.authorization;
    }
  };
}

export const mobileHandoffStore = createMobileHandoffStore();
