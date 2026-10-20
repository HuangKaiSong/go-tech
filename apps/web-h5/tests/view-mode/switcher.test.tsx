import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ViewModeShell from '@/app/components/ViewModeShell';
import { ViewModeProvider } from '@/contexts/view-mode-context';
import { MOBILE_BREAKPOINT, VIEW_MODE_COOKIE, type ViewMode } from '@/lib/view-mode';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams('product=pms')
}));
vi.mock('@/app/lib/navigation-progress', () => ({ getNavigationProgressSnapshot: () => false }));
vi.mock('@/app/components/navigation-progress', () => ({ NavigationProgress: () => null }));
vi.mock('@go-tech/web-ui', () => ({ Sonner: () => null }));

const initialWidth = window.innerWidth;
const setWindowWidth = (width: number) =>
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });

afterEach(() => {
  setWindowWidth(initialWidth);
  document.cookie = `${VIEW_MODE_COOKIE}=; Path=/; Max-Age=0`;
  localStorage.clear();
});

describe('display mode switcher', () => {
  it('updates the automatic highlight on resize, including the mobile breakpoint', () => {
    setWindowWidth(MOBILE_BREAKPOINT + 1);
    const view = render(
      <ViewModeProvider>
        <ViewModeShell>Page</ViewModeShell>
      </ViewModeProvider>
    );
    const pc = view.getByRole('button', { name: 'PC版' });
    const mobile = view.getByRole('button', { name: '手機版' });
    const expectMobile = (selected: boolean) => {
      expect(mobile.getAttribute('aria-pressed')).toBe(String(selected));
      expect(pc.getAttribute('aria-pressed')).toBe(String(!selected));
      expect(mobile.classList.contains('bg-primary')).toBe(selected);
      expect(pc.classList.contains('bg-primary')).toBe(!selected);
    };

    expectMobile(false);
    for (const width of [MOBILE_BREAKPOINT, MOBILE_BREAKPOINT - 1, MOBILE_BREAKPOINT + 1]) {
      setWindowWidth(width);
      fireEvent.resize(window);
      expectMobile(width <= MOBILE_BREAKPOINT);
    }

    fireEvent.click(mobile);
    expectMobile(true);
    fireEvent.resize(window);
    expectMobile(true);
    fireEvent.click(pc);
    setWindowWidth(MOBILE_BREAKPOINT - 1);
    fireEvent.resize(window);
    expectMobile(true);
    expect(view.container.querySelector('[data-view-frame]')?.getAttribute('data-view-mode')).toBe('auto');
  });

  it.each<ViewMode>(['pc', 'mobile'])('resumes responsive layout after resizing from saved %s mode', initialMode => {
    document.cookie = `${VIEW_MODE_COOKIE}=${initialMode}; Path=/`;
    setWindowWidth(MOBILE_BREAKPOINT + 1);
    const view = render(
      <ViewModeProvider initialMode={initialMode}>
        <ViewModeShell>Page</ViewModeShell>
      </ViewModeProvider>
    );
    const pc = view.getByRole('button', { name: 'PC版' });
    const mobile = view.getByRole('button', { name: '手機版' });
    for (const width of [MOBILE_BREAKPOINT, MOBILE_BREAKPOINT - 1, MOBILE_BREAKPOINT + 1]) {
      setWindowWidth(width);
      fireEvent.resize(window);
      expect(mobile.getAttribute('aria-pressed')).toBe(String(width <= MOBILE_BREAKPOINT));
      expect(pc.getAttribute('aria-pressed')).toBe(String(width > MOBILE_BREAKPOINT));
      const frame = view.container.querySelector<HTMLElement>('[data-view-frame]');
      expect(frame?.getAttribute('data-view-mode')).toBe('auto');
      expect(frame?.style.width).toBe(`${width}px`);
    }
  });
});
