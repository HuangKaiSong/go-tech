import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigEventDecoder, parsePublicSnapshot } from './sse';
test('SSE decoder handles byte-by-byte Unicode, split CRLF, heartbeats and multiple events', () => {
  const decoder = new ConfigEventDecoder();
  const value = { version: '1:database:2', values: { NEXT_PUBLIC_BROWSER_MONITOR_RELEASE: '发布版本' } };
  const bytes = new TextEncoder().encode(
    `: heartbeat\r\n\r\nid: 1\r\nevent: config\r\ndata: ${JSON.stringify(value)}\r\n\r\ndata: ${JSON.stringify({ ...value, version: '2:database:0' })}\n\n`
  );
  const result = [...bytes].flatMap(byte => decoder.push(Uint8Array.of(byte)));
  assert.deepEqual(result, [value, { ...value, version: '2:database:0' }]);
});
test('public snapshot parser rejects secret, unknown and non-string fields', () => {
  for (const values of [
    { DATABASE_URL: 'mysql://secret' },
    { NEXT_PUBLIC_BETTERSTACK_SOURCE_TOKEN: 'private' },
    { UNKNOWN: 'x' },
    { NEXT_PUBLIC_KPAY_ENABLE: true }
  ])
    assert.equal(parsePublicSnapshot({ version: '1', values }), undefined);
  const decoder = new ConfigEventDecoder();
  assert.throws(() => decoder.push(new TextEncoder().encode(`data: ${'x'.repeat(131073)}`)));
});
