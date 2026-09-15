import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { clientFetch } from './client-fetch';
import { ClientHttpError, isNotifiedClientHttpError } from './client-http-error';
import { type ClientHttpErrorEvent, subscribeClientHttpErrors } from './error-events';

const originalFetch = globalThis.fetch;
const cleanups: Array<() => void> = [];

afterEach(() => {
  globalThis.fetch = originalFetch;
  cleanups.splice(0).forEach(cleanup => cleanup());
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function captureEvents() {
  const events: ClientHttpErrorEvent[] = [];
  cleanups.push(subscribeClientHttpErrors(event => events.push(event)));
  return events;
}

test('HTTP 200 和业务码 200 成功，并保留原始响应 body', async () => {
  globalThis.fetch = async () => jsonResponse({ code: 200, data: { id: 1 } });

  const response = await clientFetch('/api/example');

  assert.deepEqual(await response.json(), { code: 200, data: { id: 1 } });
});

test("字符串业务码 '200' 也视为成功", async () => {
  globalThis.fetch = async () => jsonResponse({ code: '200', data: 'ok' });

  const response = await clientFetch('/api/example');

  assert.deepEqual(await response.json(), { code: '200', data: 'ok' });
});

test('HTTP 200 中的非 200 业务码发布业务错误并抛出', async () => {
  const events = captureEvents();
  globalThis.fetch = async () =>
    jsonResponse({ code: 500, error: 'third', message: '业务说明', msg: 'second', secret: 'do-not-publish' });

  await assert.rejects(
    () => clientFetch('/api/example'),
    error =>
      error instanceof ClientHttpError &&
      error.kind === 'business' &&
      error.businessCode === 500 &&
      error.userMessage === '业务说明' &&
      error.notified
  );
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    businessCode: 500,
    id: events[0].id,
    kind: 'business',
    userMessage: '业务说明'
  });
  assert.equal('payload' in events[0], false);
});

test('字符串业务码也会作为业务错误处理', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => jsonResponse({ code: 'CONTENT_REJECTED', message: '内容不符合要求' });

  await assert.rejects(() => clientFetch('/api/example'), ClientHttpError);

  assert.equal(events[0].businessCode, 'CONTENT_REJECTED');
  assert.equal(events[0].userMessage, '内容不符合要求');
});

test('HTTP 错误存在 JSON 消息时优先发布响应消息', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => jsonResponse({ message: '请求参数错误' }, { status: 400 });

  await assert.rejects(() => clientFetch('/api/example'), ClientHttpError);

  assert.deepEqual(events[0], {
    id: events[0].id,
    kind: 'http',
    status: 400,
    userMessage: '请求参数错误'
  });
});

test('HTTP 错误没有响应报文时只发布状态，交给 UI 映射文案', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => new Response(null, { status: 503 });

  await assert.rejects(() => clientFetch('/api/example'), ClientHttpError);

  assert.deepEqual(events[0], {
    id: events[0].id,
    kind: 'http',
    status: 503
  });
});

test('HTTP 错误的纯文本响应可以作为提示信息', async () => {
  const events = captureEvents();
  globalThis.fetch = async () =>
    new Response('upstream unavailable', {
      headers: { 'Content-Type': 'text/plain' },
      status: 502
    });

  await assert.rejects(() => clientFetch('/api/example'), ClientHttpError);

  assert.equal(events[0].userMessage, 'upstream unavailable');
});

test('网络失败发布 network 错误', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  await assert.rejects(
    () => clientFetch('/api/example'),
    error => error instanceof ClientHttpError && error.kind === 'network' && error.notified
  );

  assert.deepEqual(events[0], {
    id: events[0].id,
    kind: 'network'
  });
});

test('AbortError 原样抛出且不发布错误事件', async () => {
  const events = captureEvents();
  const abortError = new DOMException('The operation was aborted', 'AbortError');
  globalThis.fetch = async () => {
    throw abortError;
  };

  await assert.rejects(
    () => clientFetch('/api/example'),
    error => error === abortError
  );

  assert.equal(events.length, 0);
});

test('feedback 为 silent 时仍抛错，但不发布错误事件', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => jsonResponse({ code: 500, message: '后台刷新失败' });

  await assert.rejects(
    () => clientFetch('/api/example', undefined, { feedback: 'silent' }),
    error => error instanceof ClientHttpError && !error.notified
  );

  assert.equal(events.length, 0);
});

test('只检查顶层业务码，不把 data.code 当成响应码', async () => {
  globalThis.fetch = async () => jsonResponse({ data: { code: 500, label: '业务数据' } });

  const response = await clientFetch('/api/example');

  assert.deepEqual(await response.json(), { data: { code: 500, label: '业务数据' } });
});

test('只有已经发布全局反馈的客户端请求错误才跳过局部提示', () => {
  const publishedError = new ClientHttpError({ kind: 'network' });
  publishedError.markNotified();

  assert.equal(isNotifiedClientHttpError(publishedError), true);
  assert.equal(isNotifiedClientHttpError(new ClientHttpError({ kind: 'network' })), false);
  assert.equal(isNotifiedClientHttpError(new Error('local validation failed')), false);
});

test('可复用调用方已有的反馈 id 替换 loading 提示', async () => {
  const events = captureEvents();
  globalThis.fetch = async () => jsonResponse({ code: 500, message: '支付失败' });

  await assert.rejects(() => clientFetch('/api/pay', undefined, { feedbackId: 'payment-loading' }), ClientHttpError);

  assert.equal(events[0].id, 'payment-loading');
});

test('自定义 signal 取消原因原样抛出且不发布错误事件', async () => {
  const events = captureEvents();
  const cancellation = new Error('request superseded');
  const controller = new AbortController();
  controller.abort(cancellation);
  globalThis.fetch = async () => {
    throw cancellation;
  };

  await assert.rejects(
    () => clientFetch('/api/background', { signal: controller.signal }),
    error => error === cancellation
  );

  assert.equal(events.length, 0);
});
