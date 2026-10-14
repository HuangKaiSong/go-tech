import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { SignJWT } from 'jose';
import { relayMonitorReport } from './relay';

function value() {
  return {
    schemaVersion: 1,
    id: randomUUID(),
    timestamp: Date.now(),
    kind: 'performance',
    hasError: false,
    metrics: [],
    context: {
      app: 'web-h5',
      sessionId: randomUUID(),
      pageId: randomUUID(),
      path: '/en',
      release: 'test',
      userAgent: 'test',
      language: 'en',
      viewport: { width: 10, height: 10 }
    }
  };
}
const config = { serviceUrl: 'http://127.0.0.1:8200', ingestToken: 'server-only-test' };
const successfulForward: typeof fetch = async () => Response.json({ code: 200 });
test('relay replaces forged identity with verified request identity, retaining credentials only in context', async () => {
  const secret = 'test-platform-secret';
  const token = await new SignJWT({ userId: 7, username: 'actual-user' })
    .setProtectedHeader({ alg: 'HS512' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
  const payload = {
    ...value(),
    context: { ...value().context, authentication: { status: 'verified', userId: 'fake-user', token: 'fake-token' } }
  };
  const incoming = request(payload);
  incoming.headers.set('cookie', `GO_TECH_AUTH_TOKEN=${token}; password=private`);
  incoming.headers.set('user-agent', 'actual-device');
  const response = await relayMonitorReport(incoming, { ...config, jwtSecret: secret }, async (_input, init) => {
    const report = JSON.parse(String(init?.body));
    assert.equal(report.context.authentication.userId, '7');
    assert.equal(report.context.authentication.status, 'verified');
    assert.equal(report.context.authentication.token, token);
    assert.equal(report.context.userAgent, 'actual-device');
    assert.equal(report.context.authentication.cookie.includes('password'), false);
    return Response.json({ code: 200 });
  });
  assert.equal(response.status, 200);
});
function request(payload: unknown = value(), origin = 'http://localhost:3001') {
  return new Request('http://localhost:3001/api/browser-monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(payload)
  });
}

test('relay validates origin and schema before forwarding, without exposing credentials', async () => {
  let calls = 0;
  const forward: typeof fetch = async (url, init) => {
    calls += 1;
    assert.equal(String(url), 'http://127.0.0.1:8200/api/reports');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer server-only-test');
    return Response.json({ secret: 'must-not-return' }, { status: 201 });
  };
  assert.equal((await relayMonitorReport(request(value(), 'http://foreign.example'), config, forward)).status, 403);
  assert.equal((await relayMonitorReport(request({ ...value(), token: 'private' }), config, forward)).status, 400);
  const response = await relayMonitorReport(request(), config, forward);
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  assert.equal((await response.text()).includes('secret'), false);
});

test('relay limits streaming input and masks upstream failure', async () => {
  assert.equal((await relayMonitorReport(request(), {})).status, 503);
  const response = await relayMonitorReport(request(), config, async () => {
    throw new Error('server-only-test');
  });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('server-only-test'), false);
  assert.equal((await relayMonitorReport(request({ value: 'x'.repeat(4 * 1024 * 1024) }), config)).status, 413);
});

test('LAN Origin uses the incoming Host when Next normalizes its internal URL to localhost', async () => {
  const lanRequest = new Request('http://localhost:3001/api/browser-monitor', {
    method: 'POST',
    body: JSON.stringify(value()),
    headers: { Origin: 'http://192.168.0.168:3001', Host: '192.168.0.168:3001', 'Content-Type': 'application/json' }
  });
  assert.equal((await relayMonitorReport(lanRequest, config, successfulForward)).status, 200);
  const attacker = new Request('http://localhost:3001/api/browser-monitor', {
    method: 'POST',
    body: JSON.stringify(value()),
    headers: {
      Origin: 'http://foreign.example',
      Host: '192.168.0.168:3001',
      'X-Forwarded-Host': 'foreign.example',
      'Content-Type': 'application/json'
    }
  });
  assert.equal((await relayMonitorReport(attacker, config, successfulForward)).status, 403);
});

test('proxy public origins require an explicit server allowlist', async () => {
  const createRequest = () =>
    new Request('http://internal:3001/api/browser-monitor', {
      method: 'POST',
      body: JSON.stringify(value()),
      headers: { Origin: 'https://portal.example.com', Host: 'internal:3001', 'Content-Type': 'application/json' }
    });
  assert.equal((await relayMonitorReport(createRequest(), config, successfulForward)).status, 403);
  assert.equal(
    (
      await relayMonitorReport(
        createRequest(),
        { ...config, allowedOrigins: ['https://portal.example.com'] },
        successfulForward
      )
    ).status,
    200
  );
});

test('recovered reports never inherit credentials from a later logged-in user', async () => {
  const incoming = request();
  incoming.headers.set('X-Monitor-Delivery', 'recovered');
  incoming.headers.set('Cookie', 'GO_TECH_AUTH_TOKEN=later-user');
  const response = await relayMonitorReport(incoming, config, async (_url, init) => {
    assert.deepEqual(JSON.parse(String(init?.body)).context.authentication, { status: 'unverified' });
    return Response.json({ code: 200 });
  });
  assert.equal(response.status, 200);
});

test('relay acknowledges individual chunks without claiming a complete report commit or exposing upstream extras', async () => {
  const id = randomUUID();
  const incoming = request({
    protocol: 'monitor-chunk-v1',
    id,
    uploadId: randomUUID(),
    index: 0,
    total: 2,
    data: 'e30='
  });
  incoming.headers.set('X-Monitor-Delivery', 'recovered');
  const response = await relayMonitorReport(incoming, config, async (url, init) => {
    assert.equal(String(url), 'http://127.0.0.1:8200/api/report-chunks');
    assert.deepEqual(JSON.parse(String(init?.body)).authentication, { status: 'unverified' });
    return Response.json({ code: 200, data: { id, complete: false, nextIndex: 1, secret: 'must-not-return' } });
  });
  assert.deepEqual(await response.json(), { code: 200, data: { id, complete: false, nextIndex: 1 } });
});
