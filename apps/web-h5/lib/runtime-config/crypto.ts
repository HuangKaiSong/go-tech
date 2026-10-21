import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { ConfigError, type ConfigKey, type ConfigValues, definition, isConfigKey } from './definitions';
function encryptionKey() {
  const value = process.env.RUNTIME_CONFIG_ENCRYPTION_KEY ?? '';
  if (!/^[a-f\d]{64}$/i.test(value))
    throw new ConfigError('RUNTIME_CONFIG_ENCRYPTION_KEY 必须为 32 字节十六进制密钥', 503);
  return Buffer.from(value, 'hex');
}
export function encodeValues(values: ConfigValues): string {
  const encoded: Record<string, string> = {};
  for (const [name, value] of Object.entries(values)) {
    if (!isConfigKey(name) || typeof value !== 'string') throw new ConfigError('配置数据无效', 503);
    if (!definition(name).secret) {
      encoded[name] = value;
    } else {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
      cipher.setAAD(Buffer.from(name));
      const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      encoded[name] = `gcm:${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')}`;
    }
  }
  const payload = JSON.stringify(encoded);
  if (Buffer.byteLength(payload, 'utf8') > 60000) throw new ConfigError('配置总大小超过存储限制');
  return payload;
}
export function decodeValues(json: string): ConfigValues {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid configuration data');
    const values: ConfigValues = {};
    for (const [name, input] of Object.entries(parsed)) {
      if (!isConfigKey(name) || typeof input !== 'string') throw new Error('Invalid configuration data');
      if (!definition(name).secret) {
        values[name] = input;
      } else {
        if (!input.startsWith('gcm:')) throw new Error('Invalid configuration data');
        const bytes = Buffer.from(input.slice(4), 'base64');
        const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), bytes.subarray(0, 12));
        decipher.setAAD(Buffer.from(name));
        decipher.setAuthTag(bytes.subarray(12, 28));
        values[name as ConfigKey] = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString(
          'utf8'
        );
      }
    }
    return values;
  } catch {
    throw new ConfigError('配置解密或数据校验失败，请检查加密密钥与备份', 503);
  }
}

export function configDigest(purpose: string, value: string) {
  return createHmac('sha256', encryptionKey()).update(`${purpose}:${value}`).digest('hex');
}
