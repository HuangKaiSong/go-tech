import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reportSchema } from '@go-tech/monitor-contract';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { SignJWT } from 'jose';
import { monitorAuthentication } from './authentication';
import { createServerErrorReport, sendServerErrorReport } from './server-report';

const secret = 'monitor-test-signing-key';
async function signedToken() {
  return new SignJWT({ userId: 42, username: 'test-user' })
    .setProtectedHeader({ alg: 'HS512' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
}

test('server error retains occurrence time, request device, verified identity and credentials without passwords or SQL', async () => {
  const token = await signedToken();
  const headers = new Headers({
    'user-agent': 'test-device',
    'accept-language': 'zh-HK',
    'sec-ch-ua-platform': '"macOS"',
    'sec-ch-ua-mobile': '?0',
    cookie: `GO_TECH_AUTH_TOKEN=${token}; password=must-not-store; GO_TECH_MONITOR_SESSION=11111111-1111-4111-8111-111111111111`
  });
  const cause = Object.assign(new Error('password=private'), { code: 'ECONNREFUSED' });
  const report = await createServerErrorReport(
    new DrizzleQueryError('select private_data', ['secret'], cause),
    {
      headers,
      path: '/feedback?token=private',
      method: 'GET',
      routeType: 'render'
    },
    { jwtSecret: secret, timestamp: 123456789 }
  );
  assert.equal(reportSchema.safeParse(report).success, true);
  assert.equal(report.timestamp, 123456789);
  assert.equal(report.timeSource, 'server');
  assert.equal(report.context.path, '/feedback');
  assert.equal(report.context.userAgent, 'test-device');
  assert.equal(report.context.device?.platform, 'macOS');
  assert.equal(report.context.authentication?.status, 'verified');
  assert.equal(report.context.authentication?.userId, '42');
  assert.equal(report.context.authentication?.username, 'test-user');
  assert.equal(report.context.authentication?.token, token);
  assert.equal(report.context.authentication?.cookie, `GO_TECH_AUTH_TOKEN=${token}`);
  assert.equal(report.context.sessionId, '11111111-1111-4111-8111-111111111111');
  assert.deepEqual(report.replay, { events: [], unavailableReason: 'server-error' });
  assert.equal(report.error.message, 'Database query failed (ECONNREFUSED)');
  assert.equal(JSON.stringify(report.error).includes('private_data'), false);
  assert.equal(JSON.stringify(report).includes('must-not-store'), false);
});

test('credentials cannot claim a verified identity with an invalid signature', async () => {
  const token = await signedToken();
  const headers = new Headers({ authorization: `Bearer ${token}` });
  assert.equal((await monitorAuthentication(headers, 'wrong-key')).status, 'invalid');
  assert.equal((await monitorAuthentication(headers, 'wrong-key')).userId, undefined);
  assert.equal((await monitorAuthentication(headers)).status, 'unverified');
  assert.equal((await monitorAuthentication(new Headers())).status, 'anonymous');
});

test('server report forwards directly and isolates monitor outages and recursive monitor requests', async () => {
  const request = { path: '/feedback', method: 'GET', headers: new Headers() };
  const config = { serviceUrl: 'http://localhost:8200', ingestToken: 'test-ingest' };
  let calls = 0;
  await sendServerErrorReport(new Error('Bearer private password=hidden'), request, {
    ...config,
    forward: async (url, init) => {
      calls += 1;
      assert.equal(String(url), 'http://localhost:8200/api/reports');
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-ingest');
      const body = reportSchema.parse(JSON.parse(String(init?.body)));
      assert.equal(body.kind, 'error');
      if (body.kind === 'error') assert.equal(body.error.message.includes('private'), false);
      throw new Error('transport unavailable');
    }
  });
  assert.equal(calls, 1);
  await sendServerErrorReport(
    new Error('test'),
    { ...request, path: '/api/browser-monitor/admin' },
    {
      ...config,
      forward: async () => {
        throw new Error('must not run');
      }
    }
  );
  await sendServerErrorReport(new Error('test'), request, {
    forward: async () => {
      throw new Error('must not run');
    }
  });
});
