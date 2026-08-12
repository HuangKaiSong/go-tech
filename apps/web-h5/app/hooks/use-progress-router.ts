'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';
import { completeNavigationTransition, startNavigationTransition } from '@/app/lib/navigation-progress';

export function useProgressRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) completeNavigationTransition();
    wasPending.current = isPending;
  }, [isPending]);

  const runNavigation = (navigate: () => void) => {
    startNavigationTransition();
    startTransition(navigate);
  };

  return {
    back() {
      runNavigation(() => router.back());
    },
    forward() {
      runNavigation(() => router.forward());
    },
    prefetch: router.prefetch,
    push(...args: Parameters<typeof router.push>) {
      runNavigation(() => router.push(...args));
    },
    refresh() {
      runNavigation(() => router.refresh());
    },
    replace(...args: Parameters<typeof router.replace>) {
      runNavigation(() => router.replace(...args));
    }
  };
}
