import { fireEvent, render, screen } from '@testing-library/react';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { describe, expect, it, vi } from 'vitest';
import { captureServerError } from '@/lib/browser-monitor/server';
import FeedbackUnavailable from './feedback-unavailable';
import { renderFeedbackPage } from './render-feedback-page';

const { locale, refresh } = vi.hoisted(() => ({ refresh: vi.fn(), locale: { value: 'zh-cn' } }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/browser-monitor/server', () => ({ captureServerError: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('next-intl', () => ({ useLocale: () => locale.value }));
vi.mock('@/app/components/v2/Header', () => ({ default: () => <nav>GO-TECH</nav> }));
vi.mock('@/app/components/Link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>
}));

describe('feedback data failure', () => {
  it('renders a friendly fallback for a database connection failure without query details', async () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await renderFeedbackPage(async () => {
      throw new DrizzleQueryError('select private_data', ['secret'], new Error('ECONNREFUSED'));
    });
    render(result);
    expect(screen.getByRole('heading').textContent).toBe('反馈服务暂时无法连接');
    expect(document.body.textContent).not.toContain('private_data');
    expect(document.body.textContent).not.toContain('secret');
    expect(log).toHaveBeenCalledOnce();
    expect(captureServerError).toHaveBeenCalledOnce();
    expect(vi.mocked(captureServerError).mock.calls[0][0]).toBeInstanceOf(DrizzleQueryError);
  });

  it('preserves successful page content', async () => {
    const content = <div>Feedback categories</div>;
    expect(await renderFeedbackPage(async () => content)).toBe(content);
  });

  it.each(['NEXT_HTTP_ERROR_FALLBACK;404', 'Unexpected render error'])('preserves %s', async message => {
    const error = new Error(message);
    await expect(
      renderFeedbackPage(async () => {
        throw error;
      })
    ).rejects.toBe(error);
  });

  it('re-fetches the current route on retry', () => {
    render(<FeedbackUnavailable />);
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: '返回首页' }).getAttribute('href')).toBe('/');
  });

  it('supports Traditional Chinese and English without a translation service', () => {
    for (const [value, title] of [
      ['zh-hk', '反饋服務暫時無法連接'],
      ['en-us', 'Feedback service is temporarily unavailable']
    ]) {
      locale.value = value;
      const view = render(<FeedbackUnavailable />);
      expect(screen.getByRole('heading').textContent).toBe(title);
      view.unmount();
    }
    locale.value = 'zh-cn';
  });
});
