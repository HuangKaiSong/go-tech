import { toast } from '@go-tech-frontend/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TOKEN_KEY } from '@/hooks/use-auth';
import { authLoader } from './index';

vi.mock('@go-tech-frontend/three', () => ({
  canUseNebula: () => false,
  Experience: vi.fn()
}));

function encode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createToken(expiresAt: number): string {
  return [encode({ alg: 'none', typ: 'JWT' }), encode({ exp: expiresAt }), 'signature'].join('.');
}

describe('authLoader', () => {
  const toastError = vi.spyOn(toast, 'error').mockReturnValue('toast-id');

  beforeEach(() => {
    localStorage.clear();
    toastError.mockClear();
  });

  it('未登录时跳转登录页并保留来源地址', () => {
    const response = authLoader({ request: new Request('https://admin.example.com/orders?page=2') });

    expect(response).toBeInstanceOf(Response);
    expect(response?.headers.get('Location')).toBe('/login?from=%2Forders%3Fpage%3D2');
    expect(response?.headers.get('X-Remix-Replace')).toBe('true');
    expect(toastError).toHaveBeenCalledWith('请先登录');
  });

  it('token 有效时允许进入后台路由', () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(createToken(Math.floor(Date.now() / 1000) + 3600)));

    const response = authLoader({ request: new Request('https://admin.example.com/orders') });

    expect(response).toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('token 过期时跳转登录页', () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(createToken(Math.floor(Date.now() / 1000) - 3600)));

    const response = authLoader({ request: new Request('https://admin.example.com/customers/1') });

    expect(response?.headers.get('Location')).toBe('/login?from=%2Fcustomers%2F1');
    expect(toastError).toHaveBeenCalledWith('登录凭证已过期, 请重新登录');
  });
});
