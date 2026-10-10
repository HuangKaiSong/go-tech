import { act, fireEvent, render } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ViewModeShell from '@/app/components/ViewModeShell';

const route = vi.hoisted(() => ({ pathname: '/', pending: false, mode: 'mobile' }));
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams('product=pms')
}));
vi.mock('@/contexts/view-mode-context', () => ({
  useViewMode: () => ({ mode: route.mode, setMode: vi.fn(), frame: { width: 430, height: 720, scale: 1 } })
}));
vi.mock('@/app/lib/navigation-progress', () => ({ getNavigationProgressSnapshot: () => route.pending }));
vi.mock('@/app/components/navigation-progress', () => ({ NavigationProgress: () => null }));
vi.mock('@go-tech/web-ui', () => ({ Sonner: () => null }));

beforeEach(() => {
  route.pathname = '/';
  route.pending = false;
  route.mode = 'mobile';
});

describe('application frame and real route lifecycle', () => {
  it('preserves page state while changing display modes', () => {
    const mount = vi.fn();
    function Page() {
      useEffect(mount, []);
      return <div>Plan configuration</div>;
    }
    const view = render(
      <ViewModeShell>
        <Page />
      </ViewModeShell>
    );
    route.mode = 'pc';
    view.rerender(
      <ViewModeShell>
        <Page />
      </ViewModeShell>
    );
    expect(mount).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector('[data-view-frame]')?.getAttribute('data-view-mode')).toBe('pc');
    expect(view.container.querySelector('iframe')).toBeNull();
  });

  it('restores history scroll without letting navigation overwrite the saved position', () => {
    const page = (
      <ViewModeShell>
        <div>Page</div>
      </ViewModeShell>
    );
    const view = render(page);
    const root = view.container.querySelector<HTMLElement>('[data-view-scroll-root]');
    if (!root) throw new Error('Missing scroll root');
    root.scrollTop = 480;
    fireEvent.scroll(root);
    route.pending = true;
    root.scrollTop = 0;
    fireEvent.scroll(root);
    route.pathname = '/core-advantages';
    view.rerender(
      <ViewModeShell>
        <div>Other page</div>
      </ViewModeShell>
    );
    route.pending = false;
    root.scrollTop = 80;
    fireEvent.scroll(root);
    fireEvent.popState(window);
    route.pathname = '/';
    view.rerender(page);
    expect(root.scrollTop).toBe(480);
    fireEvent.popState(window);
    route.pathname = '/core-advantages';
    view.rerender(
      <ViewModeShell>
        <div>Other page</div>
      </ViewModeShell>
    );
    expect(root.scrollTop).toBe(80);
  });

  it('waits for async page content before finishing a history restore', () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }
      }
    );
    const view = render(
      <ViewModeShell>
        <div>Page</div>
      </ViewModeShell>
    );
    const root = view.container.querySelector<HTMLElement>('[data-view-scroll-root]');
    if (!root) throw new Error('Missing scroll root');
    let current = 0;
    let maximum = 1000;
    Object.defineProperty(root, 'scrollTop', {
      get: () => current,
      set: value => {
        current = Math.min(value, maximum);
      }
    });
    root.scrollTop = 800;
    fireEvent.scroll(root);
    route.pathname = '/my-orders';
    view.rerender(
      <ViewModeShell>
        <div>Other page</div>
      </ViewModeShell>
    );
    maximum = 200;
    fireEvent.popState(window);
    route.pathname = '/';
    view.rerender(
      <ViewModeShell>
        <div>Loading page</div>
      </ViewModeShell>
    );
    expect(root.scrollTop).toBe(200);
    maximum = 1000;
    act(() => resizeCallbacks.at(-1)?.([], {} as ResizeObserver));
    expect(root.scrollTop).toBe(800);
  });
});
