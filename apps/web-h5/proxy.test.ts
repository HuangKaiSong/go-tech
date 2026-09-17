import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import proxy from './proxy';

test('未登录访问受保护页面时跳转并保留完整路由', () => {
  const response = proxy(new NextRequest('https://example.com/en-us/my-orders?page=2'));

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get('location'),
    'https://example.com/en-us/account/login?redirect=%2Fen-us%2Fmy-orders%3Fpage%3D2'
  );
});

test('存在登录 cookie 时允许访问受保护页面', () => {
  const response = proxy(
    new NextRequest('https://example.com/zh-cn/settings', {
      headers: { cookie: 'GO_TECH_AUTH_TOKEN=token' }
    })
  );

  assert.equal(response.headers.get('location'), null);
});

test('空登录 cookie 不视为已登录', () => {
  const response = proxy(
    new NextRequest('https://example.com/settings', {
      headers: { cookie: 'GO_TECH_AUTH_TOKEN=' }
    })
  );

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://example.com/account/login?redirect=%2Fsettings');
});

test('未登录仍可访问公开页面', () => {
  const response = proxy(new NextRequest('https://example.com/pricing-plan'));

  assert.equal(response.headers.get('location'), null);
});
