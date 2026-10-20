'use client';

import { PortalContainerProvider } from '@go-tech-frontend/ui';
import { Sonner } from '@go-tech/web-ui';
import { Monitor, Smartphone } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getNavigationProgressSnapshot } from '@/app/lib/navigation-progress';
import { useViewMode } from '@/contexts/view-mode-context';
import { MOBILE_BREAKPOINT } from '@/lib/view-mode';
import { NavigationProgress } from './navigation-progress';

export default function ViewModeShell({ children, controls }: { children: ReactNode; controls?: ReactNode }) {
  const { frame, mode, setMode } = useViewMode();
  const automaticMode = (frame?.width ?? 1280) <= MOBILE_BREAKPOINT ? 'mobile' : 'pc';
  const activeMode = mode === 'auto' ? automaticMode : mode;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const scrollRoot = useRef<HTMLDivElement>(null);
  const [frameRoot, setFrameRoot] = useState<HTMLDivElement | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const previousRoute = useRef(routeKey);
  const historyNavigation = useRef(false);
  const restoringScroll = useRef(false);
  const scrollPositions = useRef(new Map<string, number>());

  useEffect(() => {
    const root = scrollRoot.current;
    if (!root) return;
    const observer = new ResizeObserver(() => setScrollbarWidth(root.offsetWidth - root.clientWidth));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const restoreHistory = () => {
      const root = scrollRoot.current;
      if (root) scrollPositions.current.set(previousRoute.current, root.scrollTop);
      historyNavigation.current = true;
    };
    const scrollToHash = () => {
      if (!location.hash) return;
      try {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' });
      } catch {
        // Ignore malformed URL fragments.
      }
    };
    window.addEventListener('popstate', restoreHistory, true);
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      window.removeEventListener('popstate', restoreHistory, true);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  useLayoutEffect(() => {
    const root = scrollRoot.current;
    if (!root) return;
    const oldPathname = previousRoute.current.split('?')[0];
    let observer: ResizeObserver | undefined;
    const stopRestoring = () => {
      restoringScroll.current = false;
      observer?.disconnect();
    };
    if (historyNavigation.current) {
      const target = scrollPositions.current.get(routeKey) ?? 0;
      restoringScroll.current = true;
      const restore = () => {
        root.scrollTop = target;
        if (Math.abs(root.scrollTop - target) < 1) stopRestoring();
      };
      observer = new ResizeObserver(restore);
      if (root.firstElementChild) observer.observe(root.firstElementChild);
      restore();
    } else if (oldPathname !== pathname) {
      root.scrollTop = 0;
    }
    historyNavigation.current = false;
    previousRoute.current = routeKey;
    // Stop a pending restore as soon as the user starts interacting with the new page.
    const inputEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    for (const event of inputEvents) root.addEventListener(event, stopRestoring, { passive: true });
    const animation = requestAnimationFrame(() => {
      if (!location.hash) return;
      try {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' });
      } catch {
        // Ignore malformed URL fragments.
      }
    });
    return () => {
      cancelAnimationFrame(animation);
      stopRestoring();
      for (const event of inputEvents) root.removeEventListener(event, stopRestoring);
    };
  }, [pathname, routeKey]);

  const style: CSSProperties | undefined = frame
    ? ({
        width: frame.width,
        height: frame.height,
        transform: `scale(${frame.scale})`,
        '--view-height': `${frame.height}px`,
        '--view-scrollbar': `${scrollbarWidth}px`
      } as CSSProperties)
    : undefined;

  return (
    <div className="view-mode-stage" data-view-mode={mode}>
      <div
        ref={setFrameRoot}
        className="view-mode-frame @container/view"
        data-view-frame
        data-view-mode={mode}
        style={style}
      >
        <PortalContainerProvider container={portalRoot} boundary={frameRoot ?? undefined}>
          <div
            ref={scrollRoot}
            className="view-mode-scroll"
            data-view-scroll-root
            onScroll={event => {
              if (historyNavigation.current || restoringScroll.current || getNavigationProgressSnapshot()) return;
              scrollPositions.current.set(previousRoute.current, event.currentTarget.scrollTop);
            }}
          >
            {children}
          </div>
          <div className="view-mode-controls">{controls}</div>
          <div ref={setPortalRoot} className="view-mode-portals" data-view-portal-root />
          <Sonner className="toaster group" position="top-right" richColors />
          <NavigationProgress />
        </PortalContainerProvider>
      </div>
      <div className="view-mode-switcher" role="group" aria-label="顯示模式">
        {(
          [
            ['pc', Monitor, 'PC版'],
            ['mobile', Smartphone, '手機版']
          ] as const
        ).map(([value, Icon, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={activeMode === value}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${activeMode === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
