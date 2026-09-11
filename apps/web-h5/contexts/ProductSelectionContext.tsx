'use client';

import type { PackageBizCode } from '@go-tech/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';

type SelectProductOptions = {
  syncUrl?: boolean;
};

type ProductSelectionContextValue = {
  allowProductlessNavigation: () => void;
  product: PackageBizCode;
  selectProduct: (product: PackageBizCode, options?: SelectProductOptions) => void;
};

const ProductSelectionContext = createContext<ProductSelectionContextValue | null>(null);

const toProductKey = (value: string | null): PackageBizCode | null =>
  value === 'hr' || value === 'pms' ? value : null;

export function ProductSelectionProvider({
  children,
  initialProduct
}: {
  children: React.ReactNode;
  initialProduct?: PackageBizCode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProduct = toProductKey(searchParams.get('product'));
  const [product, setProduct] = useState<PackageBizCode>(() => queryProduct ?? initialProduct ?? 'pms');
  const [isPending, startTransition] = useTransition();
  const shouldKeepProductInUrl = useRef(queryProduct !== null || initialProduct !== undefined);

  useEffect(() => {
    // 导航期间保留即时选择，避免旧 URL 把 Header / Hero 切回上一个产品。
    if (isPending || !queryProduct) return;

    shouldKeepProductInUrl.current = true;
    setProduct(queryProduct);
  }, [isPending, pathname, queryProduct]);

  useEffect(() => {
    if (queryProduct || isPending || !shouldKeepProductInUrl.current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('product', product);
    const href = `${pathname}?${params.toString()}${window.location.hash}`;
    startTransition(() => router.replace(href, { scroll: false }));
  }, [isPending, pathname, product, queryProduct, router, searchParams]);

  const allowProductlessNavigation = () => {
    // 显式进入无产品选择页时不补参，下一次选择产品或带参导航会恢复同步。
    shouldKeepProductInUrl.current = false;
  };

  const selectProduct = (nextProduct: PackageBizCode, options: SelectProductOptions = {}) => {
    setProduct(nextProduct);
    if (options.syncUrl === false) return;

    shouldKeepProductInUrl.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.set('product', nextProduct);
    const href = `${pathname}?${params.toString()}${window.location.hash}`;
    // 通过 Next 路由获取新的服务端组件结果，而不是只更新浏览器地址。
    startTransition(() => router.replace(href, { scroll: false }));
  };

  return (
    <ProductSelectionContext.Provider value={{ allowProductlessNavigation, product, selectProduct }}>
      {children}
    </ProductSelectionContext.Provider>
  );
}

export const useOptionalProductSelection = () => useContext(ProductSelectionContext);

export const useProductSelection = () => {
  const context = useOptionalProductSelection();
  if (!context) throw new Error('useProductSelection must be used inside ProductSelectionProvider');
  return context;
};
