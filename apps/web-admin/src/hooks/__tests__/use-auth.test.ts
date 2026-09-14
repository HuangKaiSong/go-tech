import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAuth } from '../use-auth';

/** 构造一个有效的token */
function base64UrlEncodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);

  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('useAuth test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {});

  it('本地没有保存 token', () => {
    const { result } = renderHook(() => useAuth());
    const { isAuthenticated, isExpired, token, user } = result.current;
    expect(token).toBeUndefined();
    expect(isAuthenticated).toBeFalsy();
    expect(isExpired).toBeTruthy();
    expect(user).toBeNull();
  });

  it('token 存在且有效', () => {
    const { result } = renderHook(() => useAuth());

    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      sub: '123',
      name: '小可爱', // 想看 user 里有啥就加啥
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 小时后过期
    };
    const token = [
      base64UrlEncodeJson(header),
      base64UrlEncodeJson(payload),
      'anything' // 签名段可以随便填，甚至空字符串，但必须保留第二个点
    ].join('.');

    act(() => {
      result.current.setToken(token);
    });

    expect(result.current.token).toBe(token);
    expect(result.current.isExpired).toBeFalsy();
    expect(result.current.isAuthenticated).toBeTruthy();
    expect(result.current.user).toEqual(payload);
    expect(result.current.user).toMatchObject({ sub: '123', name: '小可爱' });
  });

  it('token 过期', () => {
    const { result } = renderHook(() => useAuth());
    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      sub: '123',
      name: '小可爱', // 想看 user 里有啥就加啥
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 小时前过期
    };
    const token = [
      base64UrlEncodeJson(header),
      base64UrlEncodeJson(payload),
      'anything' // 签名段可以随便填，甚至空字符串，但必须保留第二个点
    ].join('.');

    act(() => {
      result.current.setToken(token);
    });

    expect(result.current.token).toBe(token);
    expect(result.current.isExpired).toBeTruthy();
    expect(result.current.isAuthenticated).toBeFalsy();
    // user 就是解析出来的 payload
    expect(result.current.user).toEqual(payload);
    // 或者只校验关心的字段
    expect(result.current.user).toMatchObject({ sub: '123', name: '小可爱' });
  });

  it('无效的token', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setToken('invalid-token');
    });
    expect(result.current.token).toBe('invalid-token');
    expect(result.current.isExpired).toBeTruthy();
    expect(result.current.isAuthenticated).toBeFalsy();
    expect(result.current.user).toBeNull();
  });

  it.each([
    { label: 'null', token: null },
    { label: 'undefined', token: undefined },
    { label: '空字符串', token: '' }
  ])('token 为 $label 时 useAuth 返回判断', ({ token }) => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setToken(token as any);
    });

    expect(result.current.token).toBeFalsy();
    expect(result.current.isExpired).toBeTruthy();
    expect(result.current.isAuthenticated).toBeFalsy();
    expect(result.current.user).toBeNull();
  });
});
