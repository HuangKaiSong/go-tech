import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RuntimeConfigSettings from './index';
vi.mock('@/hooks/use-auth', () => ({ getStoredToken: () => 'admin-token' }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const infrastructure = {
  version: 1,
  contextVersion: '1:db',
  fields: [{ key: 'DATABASE_URL', type: 'string', group: '数据库', secret: true, configured: true, source: 'database' }]
};
const business = {
  version: 2,
  contextVersion: '1:db',
  fields: [
    {
      key: 'NEXT_PUBLIC_KPAY_ENABLE',
      type: 'boolean',
      group: '支付',
      value: 'false',
      configured: true,
      source: 'environment'
    }
  ]
};
function transport(handler?: (url: string, init: RequestInit) => Response | undefined) {
  const mock = vi.fn(
    async (input: string, init: RequestInit = {}) =>
      handler?.(input, init) ??
      Response.json({ code: 200, data: input.endsWith('infrastructure') ? infrastructure : business })
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}
describe('runtime configuration settings', () => {
  it('shows masked secrets and saves only modified fields with token and version', async () => {
    const fetch = transport((_url, init) => (init.method === 'PATCH' ? Response.json({ code: 200 }) : undefined));
    render(<RuntimeConfigSettings />);
    const select = await screen.findByLabelText('NEXT_PUBLIC_KPAY_ENABLE');
    fireEvent.change(select, { target: { value: 'true' } });
    const section = select.closest('section');
    expect(section).not.toBeNull();
    fireEvent.click(within(section as HTMLElement).getByRole('button', { name: '保存并生效' }));
    await screen.findByText('配置已保存并生效');
    const saved = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(saved?.[1]?.body))).toEqual({
      version: 2,
      contextVersion: '1:db',
      changes: { NEXT_PUBLIC_KPAY_ENABLE: 'true' }
    });
    expect(saved?.[1]?.headers).toMatchObject({ Authorization: 'Bearer admin-token' });
    expect((screen.getByLabelText('DATABASE_URL') as HTMLInputElement).value).toBe('');
  });
  it('requires a successful database preview before allowing a switch and keeps edits on conflict', async () => {
    const fetch = transport((_url, init) => {
      if (init.method === 'POST')
        return Response.json({
          code: 200,
          data: {
            confirmation: 'preview-digest',
            targetVersion: 9,
            changes: [{ key: 'NEXT_PUBLIC_PMS_TRIAL_HOST', changed: true }]
          }
        });
      if (init.method === 'PATCH')
        return Response.json({ code: 409, message: '配置已被修改，请重新加载' }, { status: 409 });
      return undefined;
    });
    render(<RuntimeConfigSettings />);
    const input = await screen.findByLabelText('DATABASE_URL');
    fireEvent.change(input, { target: { value: 'mysql://target/config' } });
    const save = screen.getByRole('button', { name: '确认切换并保存' });
    expect(save).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '验证并预览切库差异' }));
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);
    await screen.findByText('配置已被修改，请重新加载');
    expect((input as HTMLInputElement).value).toBe('mysql://target/config');
    expect(
      fetch.mock.calls.some(
        ([, init]) => init?.method === 'PATCH' && JSON.parse(String(init.body)).confirmation === 'preview-digest'
      )
    ).toBe(true);
  });
});
