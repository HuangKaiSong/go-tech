import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLoginRedirectUrl,
  getSafePostLoginPath,
  isLoginPagePathname,
  isProtectedPagePathname
} from './auth-redirect';

test('识别带语言前缀和不带语言前缀的受保护页面', () => {
  assert.equal(isProtectedPagePathname('/my-orders'), true);
  assert.equal(isProtectedPagePathname('/en-us/my-orders/123'), true);
  assert.equal(isProtectedPagePathname('/zh-cn/settings'), true);
  assert.equal(isProtectedPagePathname('/pricing-plan'), false);
  assert.equal(isProtectedPagePathname('/en-us/account/login'), false);
});

test('登录地址保留语言、查询参数与 hash', () => {
  const loginUrl = buildLoginRedirectUrl({
    hash: '#payment',
    origin: 'https://example.com',
    pathname: '/en-us/my-orders/123',
    search: '?tab=pending'
  });

  assert.equal(loginUrl.pathname, '/en-us/account/login');
  assert.equal(loginUrl.searchParams.get('redirect'), '/en-us/my-orders/123?tab=pending#payment');
});

test('登录页识别支持语言前缀', () => {
  assert.equal(isLoginPagePathname('/account/login'), true);
  assert.equal(isLoginPagePathname('/zh-hk/account/login'), true);
  assert.equal(isLoginPagePathname('/account/register'), false);
});

test('登录后只允许回跳站内非登录页面', () => {
  assert.equal(getSafePostLoginPath('/zh-cn/my-orders?page=2#latest'), '/zh-cn/my-orders?page=2#latest');
  assert.equal(getSafePostLoginPath('https://attacker.example/path'), null);
  assert.equal(getSafePostLoginPath('//attacker.example/path'), null);
  assert.equal(getSafePostLoginPath('/account/login'), null);
});
