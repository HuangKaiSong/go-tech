import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RuntimeConfigSettings from '@/pages/runtime-config';
import AdminLayout from './AdminLayout';
const auth = vi.hoisted(() => ({ token: 'admin-token' }));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => auth, getStoredToken: () => auth.token }));
vi.mock('./AdminHeader', () => ({ default: () => null }));
vi.mock('./AdminSidebar', () => ({ default: () => null }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  auth.token = 'admin-token';
});
function mount() {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<RuntimeConfigSettings />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
describe('admin layout authentication headers', () => {
  it('sends exactly one Bearer credential for both runtime configuration endpoints', async () => {
    const received: { headers: Headers; url: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        received.push({ url, headers: new Headers(init?.headers) });
        return Response.json({ code: 200, data: { version: 1, contextVersion: '1:db', fields: [] } });
      })
    );
    mount();
    await waitFor(() => expect(received).toHaveLength(2));
    expect(received.map(item => item.url).toSorted()).toEqual([
      '/h5-hook/api/admin/runtime-config/business',
      '/h5-hook/api/admin/runtime-config/infrastructure'
    ]);
    for (const { headers } of received) expect(headers.get('Authorization')).toBe('Bearer admin-token');
  });
  it('retains explicit credentials and language, and fills missing credentials without duplicating Bearer', async () => {
    const received: Headers[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        received.push(new Headers(init?.headers));
        return Response.json({ code: 200, data: { version: 1, contextVersion: '1:db', fields: [] } });
      })
    );
    auth.token = 'Bearer admin-token';
    mount();
    await waitFor(() => expect(received.length).toBeGreaterThanOrEqual(2));
    await fetch('/h5-hook/test', { headers: { Authorization: 'Bearer request-token', Language: 'en-us' } });
    expect(received.at(-1)?.get('Authorization')).toBe('Bearer request-token');
    expect(received.at(-1)?.get('Language')).toBe('en-us');
    await fetch('/go-tech/test');
    expect(received.at(-1)?.get('Authorization')).toBe('Bearer admin-token');
    expect(received.at(-1)?.get('Language')).toBe('zh-TW');
  });
});
