'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  completeNavigationTransition,
  getNavigationProgressSnapshot,
  startNavigationTransition,
  subscribeNavigationProgress
} from '@/app/lib/navigation-progress';

const smoothEase = [0.22, 1, 0.36, 1] as const;

function getNavigationTarget(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (!(event.target instanceof Element)) return null;

  const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!anchor || anchor.download || (anchor.target && anchor.target !== '_self')) return null;

  const target = new URL(anchor.href, window.location.href);
  if (target.origin !== window.location.origin) return null;

  const current = window.location;
  if (target.pathname === current.pathname && target.search === current.search) return null;

  return target;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const isFirstRoute = useRef(true);
  const isNavigating = useSyncExternalStore(
    subscribeNavigationProgress,
    getNavigationProgressSnapshot,
    getNavigationProgressSnapshot
  );
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }

    completeNavigationTransition();
  }, [routeKey]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (getNavigationTarget(event)) startNavigationTransition();
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        {isNavigating ? (
          <motion.div
            animate={{ opacity: 1, scaleX: reduceMotion ? 1 : 0.78 }}
            aria-label="正在切换页面"
            aria-valuetext="正在切换页面"
            className="fixed inset-x-0 top-0 z-[100] h-1 origin-left bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
            exit={{
              opacity: 0,
              scaleX: 1,
              transition: { duration: reduceMotion ? 0.08 : 0.18, ease: smoothEase }
            }}
            initial={{ opacity: 1, scaleX: reduceMotion ? 1 : 0.08 }}
            key="navigation-progress"
            role="progressbar"
            transition={{ duration: reduceMotion ? 0.08 : 1.8, ease: smoothEase }}
          />
        ) : null}
      </AnimatePresence>
      <span aria-live="polite" className="sr-only" role="status">
        {isNavigating ? '正在切换页面' : ''}
      </span>
    </>
  );
}
