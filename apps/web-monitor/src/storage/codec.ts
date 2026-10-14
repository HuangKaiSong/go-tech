import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { MAX_REPORT_BYTES, reportSchema } from '@go-tech/monitor-contract';
import type { StoredReport } from './report-store';

export function compareStrings(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .toSorted(([a], [b]) => compareStrings(a, b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(',')}}`;
}
export function sha256(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}
export function storedHash(stored: StoredReport) {
  return sha256(canonical(stored));
}
export function validateStored(stored: StoredReport, retentionMs: number) {
  reportSchema.parse(stored.report);
  for (const time of [stored.receivedAt, stored.receivedAt + retentionMs, stored.report.timestamp]) {
    if (!Number.isSafeInteger(time) || time < 0) throw new Error('Time cannot be represented losslessly');
  }
  if (
    stored.report.kind === 'error' &&
    stored.report.error.kind === 'next-server' &&
    stored.report.replay.events.length
  )
    throw new Error('Server replay is invalid');
  if (Buffer.byteLength(JSON.stringify(stored.report)) > MAX_REPORT_BYTES) throw new Error('Report too large');
}
export class ReportCodec {
  private readonly keys: Map<string, Buffer>;
  constructor(
    readonly version: string,
    keys: Record<string, string>
  ) {
    this.keys = new Map(
      Object.entries(keys).map(([name, value]) => {
        if (!/^[\w-]{1,32}$/.test(name) || !/^[a-f\d]{64}$/i.test(value))
          throw new Error('Invalid authentication encryption key');
        return [name, Buffer.from(value, 'hex')];
      })
    );
    if (!this.keys.has(version)) throw new Error('Missing active authentication encryption key');
  }
  encrypt(value: unknown, id: string) {
    const key = this.keys.get(this.version);
    if (!key) throw new Error('Missing encryption key');
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(Buffer.from(`${id}:${this.version}`));
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64');
  }
  decrypt(value: string, version: string, id: string): unknown {
    const key = this.keys.get(version);
    if (!key) throw new Error('Missing authentication key version');
    const bytes = Buffer.from(value, 'base64');
    const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    cipher.setAAD(Buffer.from(`${id}:${version}`));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8'));
  }
  encode(stored: StoredReport) {
    const payload = structuredClone(stored.report);
    const auth = payload.context.authentication;
    const credentials = auth ? { token: auth.token, cookie: auth.cookie } : undefined;
    if (auth) {
      delete auth.token;
      delete auth.cookie;
    }
    const events = payload.kind === 'error' ? payload.replay.events : [];
    if (payload.kind === 'error') payload.replay.events = [];
    const raw = Buffer.from(JSON.stringify(events));
    return {
      payload,
      ciphertext: credentials ? this.encrypt(credentials, payload.id) : null,
      replay: events.length ? { events: gzipSync(raw), bytes: raw.length, hash: sha256(raw) } : null
    };
  }
  static events(blob: Buffer, bytes: number, hash: string) {
    if (bytes > MAX_REPORT_BYTES || bytes < 1) throw new Error('Replay size invalid');
    const raw = gunzipSync(blob, { maxOutputLength: MAX_REPORT_BYTES });
    if (raw.length !== bytes || sha256(raw) !== hash) throw new Error('Replay integrity check failed');
    return JSON.parse(raw.toString('utf8')) as unknown;
  }
}
