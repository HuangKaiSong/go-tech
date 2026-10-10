import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Header from '@/app/components/v2/Header';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/app/components/Link', () => ({
  default: (props: ComponentProps<'a'>) => <a {...props} />
}));
vi.mock('@/app/components/DynamicI18nText', () => ({ DynamicText: ({ text }: { text: string }) => text }));
vi.mock('@/app/components/LocaleSwitcher', () => ({ default: () => null }));
vi.mock('@/app/hooks/use-progress-router', () => ({ useProgressRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/lib/go-now', () => ({ filterTenantsByBizCode: () => [], startFreeTrial: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isLoggedIn: true, user: { nickname: 'Test user' }, tenants: [], tenantsStatus: 'ready' })
}));
vi.mock('@/contexts/ProductSelectionContext', () => ({ useProductSelection: () => ({ product: 'pms' }) }));
vi.mock('@/contexts/TrialWindowContext', () => ({ useTrialWindow: () => ({ openPmsCallback: vi.fn() }) }));
vi.mock('@/contexts/view-mode-context', () => ({ useViewMode: () => ({ isMobile: true, setMode: vi.fn() }) }));
vi.mock('@go-tech/web-ui', () => ({ toast: { error: vi.fn() } }));

describe('header sheet focus restoration', () => {
  it.each([
    ['帳戶選單', 'close'],
    ['帳戶選單', 'escape'],
    ['選單', 'close'],
    ['選單', 'escape']
  ])('keeps the page position when closing %s with %s', async (name, method) => {
    const view = render(
      <div data-testid="scroll-root">
        <Header />
      </div>
    );
    const root = screen.getByTestId('scroll-root');
    const trigger = screen.getByRole('button', { name });
    const nativeFocus = trigger.focus.bind(trigger);
    // Model a browser scrolling to a sticky trigger's original layout position.
    const focus = vi.spyOn(trigger, 'focus').mockImplementation(options => {
      if (!options?.preventScroll) root.scrollTop = 61;
      nativeFocus(options);
    });
    root.scrollTop = 515;
    trigger.focus({ preventScroll: true });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    focus.mockClear();

    if (method === 'escape') fireEvent.keyDown(dialog, { key: 'Escape' });
    else fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(root.scrollTop).toBe(515);
    view.unmount();
  });
});
