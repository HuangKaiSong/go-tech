import { gzipSync } from 'node:zlib';
import { MAX_REPORT_BYTES } from '@go-tech/monitor-contract';
import { describe, expect, it } from 'vitest';
import { ReportCodec, canonical, sha256 } from '../src/storage/codec';

describe('encrypted authentication and compressed replay integrity', () => {
  it('supports old key versions and binds ciphertext to the report UUID', () => {
    const old = new ReportCodec('v1', { v1: '01'.repeat(32) });
    const rotated = new ReportCodec('v2', { v1: '01'.repeat(32), v2: '02'.repeat(32) });
    const ciphertext = old.encrypt({ token: 'synthetic' }, 'id');
    expect(rotated.decrypt(ciphertext, 'v1', 'id')).toEqual({ token: 'synthetic' });
    expect(() => rotated.decrypt(ciphertext, 'v1', 'other')).toThrow();
    const corrupt = Buffer.from(ciphertext, 'base64');
    corrupt[15] = 42;
    expect(() => rotated.decrypt(corrupt.toString('base64'), 'v1', 'id')).toThrow();
    expect(() => new ReportCodec('v3', { v1: '01'.repeat(32) })).toThrow();
  });
  it('rejects decompression bombs and modified event order/hash', () => {
    const raw = Buffer.from('[{"type":2},{"type":3}]');
    expect(ReportCodec.events(gzipSync(raw), raw.length, sha256(raw))).toEqual([{ type: 2 }, { type: 3 }]);
    expect(() => ReportCodec.events(gzipSync(raw), raw.length, sha256('wrong'))).toThrow('integrity');
    const bomb = Buffer.alloc(MAX_REPORT_BYTES + 1, 32);
    expect(() => ReportCodec.events(gzipSync(bomb), 1, sha256(bomb))).toThrow();
    expect(canonical({ b: 2, a: [3, 1] })).toBe(canonical({ a: [3, 1], b: 2 }));
  });
});
