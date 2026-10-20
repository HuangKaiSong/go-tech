import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createMobileHandoffHandlers } from './mobile-handoff';

const originalHost = process.env.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST;
const code = 'A'.repeat(43);
const authorization = `Bearer ${'a'.repeat(12_000)}`;

afterEach(() => {
  if (originalHost === undefined) delete process.env.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST;
  else process.env.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST = originalHost;
});

function setup() {
  process.env.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST = 'https://mobile.example/#/property?tab=rent';
  let stored: { audience: string; value: string } | undefined;
  return createMobileHandoffHandlers({
    async issue(value, audience) {
      stored = { value, audience };
      return code;
    },
    async consume(value, audience) {
      if (value !== code || stored?.audience !== audience) return null;
      const result = stored.value;
      stored = undefined;
      return result;
    }
  });
}

function redirectRequest(value = authorization) {
  return new Request('https://portal.example/api/pms/mobile/redirect', { headers: { authorization: value } });
}

function exchangeRequest(origin = 'https://mobile.example', value = code) {
  return new Request('https://portal.example/api/pms/mobile/exchange', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: value })
  });
}

test('12000 字符凭证仅通过 POST 响应传输，跳转地址保持短小，并仅可兑换一次', async () => {
  const handlers = setup();
  const response = await handlers.redirect(redirectRequest());
  assert.equal(response.status, 303);
  const location = response.headers.get('location') ?? '';
  assert.ok(location.length < 150);
  assert.ok(!location.includes('Bearer'));
  const target = new URL(location);
  assert.ok(target.hash.startsWith('#/property?tab=rent&handoff_code='));
  assert.equal(new URLSearchParams(target.hash.split('?')[1]).get('handoff_code'), code);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  const exchanged = await handlers.exchange(exchangeRequest());
  assert.equal(exchanged.status, 200);
  assert.equal((await exchanged.json()).data.authorization, authorization);
  assert.equal(exchanged.headers.get('access-control-allow-origin'), 'https://mobile.example');
  assert.equal(exchanged.headers.get('cache-control'), 'no-store');
  assert.equal((await handlers.exchange(exchangeRequest())).status, 401);
});

test('拒绝缺失/无效凭证及非法目标配置，不回显凭证', async () => {
  const handlers = setup();
  const invalidResponses = await Promise.all(
    ['', 'Basic secret', 'Bearer', 'Bearer a b'].map(value => handlers.redirect(redirectRequest(value)))
  );
  for (const response of invalidResponses) {
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('location'), null);
  }
  const invalidTargets = await Promise.all(
    ['', 'invalid', 'data:text/plain,invalid', 'https://user:pass@mobile.example'].map(host => {
      process.env.NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST = host;
      return handlers.redirect(redirectRequest());
    })
  );
  invalidTargets.forEach(response => assert.equal(response.status, 503));
});

test('仅允许目标站的来源兑换，跨域预检使用精确 origin', async () => {
  const handlers = setup();
  await handlers.redirect(redirectRequest());
  const denied = await handlers.exchange(exchangeRequest('https://evil.example'));
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await handlers.exchange(
    new Request('https://portal.example/api/pms/mobile/exchange', {
      method: 'OPTIONS',
      headers: { origin: 'https://mobile.example' }
    })
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'Content-Type');
  assert.equal((await handlers.exchange(exchangeRequest())).status, 200);
});

test('拒绝未知/过期的 code、错误 JSON 和超长请求体', async () => {
  const handlers = setup();
  assert.equal((await handlers.exchange(exchangeRequest())).status, 401);
  assert.equal((await handlers.exchange(exchangeRequest('https://mobile.example', 'short'))).status, 400);
  const malformed = await Promise.all(
    ['{', 'null', JSON.stringify({ code: 'A'.repeat(500) })].map(body =>
      handlers.exchange(
        new Request('https://portal.example/api/pms/mobile/exchange', {
          method: 'POST',
          headers: { origin: 'https://mobile.example' },
          body
        })
      )
    )
  );
  malformed.forEach(response => assert.equal(response.status, 400));
});

test('存储失败时返回通用错误，不泄露底层消息', async () => {
  setup();
  const handlers = createMobileHandoffHandlers({
    async issue() {
      throw new Error('secret');
    },
    async consume() {
      throw new Error('secret');
    }
  });
  const responses = await Promise.all([handlers.redirect(redirectRequest()), handlers.exchange(exchangeRequest())]);
  responses.forEach(response => assert.equal(response.status, 503));
  const bodies = await Promise.all(responses.map(response => response.text()));
  bodies.forEach(body => assert.ok(!body.includes('secret')));
});

test('浏览器 POST 模式返回可导航短地址，不让 fetch 跟随跨域重定向', async () => {
  const handlers = setup();
  const response = await handlers.redirect(redirectRequest(), 'json');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.equal(result.code, 200);
  assert.equal(new URL(result.data.url).origin, 'https://mobile.example');
  assert.ok(result.data.url.length < 150);
  assert.equal((await handlers.exchange(exchangeRequest())).status, 200);
});
