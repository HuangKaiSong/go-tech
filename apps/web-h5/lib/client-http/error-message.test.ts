import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ClientHttpErrorEvent } from './error-events';
import { getClientHttpErrorMessageKey } from './error-message';

function event(overrides: Partial<ClientHttpErrorEvent>): ClientHttpErrorEvent {
  return { id: 'request-id', kind: 'http', ...overrides };
}

test('网络错误使用统一网络提示', () => {
  assert.equal(getClientHttpErrorMessageKey(event({ kind: 'network' })), 'network');
});

test('没有业务说明时使用业务码兜底提示', () => {
  assert.equal(getClientHttpErrorMessageKey(event({ businessCode: 'CONTENT_REJECTED', kind: 'business' })), 'business');
});

test('常见 HTTP 状态映射到对应提示', () => {
  const expected = new Map([
    [400, 'badRequest'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [408, 'timeout'],
    [429, 'tooManyRequests'],
    [500, 'serverError'],
    [502, 'serviceUnavailable'],
    [503, 'serviceUnavailable'],
    [504, 'timeout']
  ] as const);

  for (const [status, messageKey] of expected) {
    assert.equal(getClientHttpErrorMessageKey(event({ status })), messageKey);
  }
});

test('未知 HTTP 状态使用通用失败提示', () => {
  assert.equal(getClientHttpErrorMessageKey(event({ status: 418 })), 'requestFailed');
});
