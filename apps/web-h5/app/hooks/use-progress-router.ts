'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';
import { completeNavigationTransition, startNavigationTransition } from '@/app/lib/navigation-progress';
import { withProductQuery } from '@/app/lib/product-navigation';
import { useOptionalProductSelection } from '@/contexts/ProductSelectionContext';

type ProgressNavigationOptions = NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]> & {
  preserveProduct?: boolean;
};

export function useProgressRouter() {
  const router = useRouter();
  const productSelection = useOptionalProductSelection();
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

  const resolveNavigationHref = (href: string, preserveProduct: boolean) => {
    if (!preserveProduct) {
      productSelection?.allowProductlessNavigation();
      return href;
    }

    return withProductQuery(href, productSelection?.product);
  };

  return {
    back() {
      runNavigation(() => router.back());
    },
    forward() {
      runNavigation(() => router.forward());
    },
    prefetch(...args: Parameters<typeof router.prefetch>) {
      const [href, options] = args;
      router.prefetch(withProductQuery(href, productSelection?.product), options);
    },
    push(href: string, options: ProgressNavigationOptions = {}) {
      const { preserveProduct = true, ...routerOptions } = options;
      runNavigation(() => router.push(resolveNavigationHref(href, preserveProduct), routerOptions));
    },
    refresh() {
      runNavigation(() => router.refresh());
    },
    replace(href: string, options: ProgressNavigationOptions = {}) {
      const { preserveProduct = true, ...routerOptions } = options;
      runNavigation(() => router.replace(resolveNavigationHref(href, preserveProduct), routerOptions));
    }
  };
}
