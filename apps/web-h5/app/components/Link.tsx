'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { withProductQuery } from '@/app/lib/product-navigation';
import { useIframeContext } from '@/contexts/IframeContext';
import { useOptionalProductSelection } from '@/contexts/ProductSelectionContext';
import type { Locale } from '@/i18n/config';
import { Link as BaseLink } from '@/i18n/navigation';

type RestrictedLinkProps = ComponentProps<typeof BaseLink> & {
  children: ReactNode;
  className?: string;
  locale?: Locale;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export const Link: React.FC<RestrictedLinkProps> = ({ children, className = '', href, onClick, ...rest }) => {
  const { hasIframe } = useIframeContext();
  const productSelection = useOptionalProductSelection();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const selectedLayoutSegment = useSelectedLayoutSegment();
  const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : '/';
  const destinationPathname = typeof href === 'string' ? href.split(/[?#]/, 1)[0] : href.pathname;
  const isActive = pathname === destinationPathname;
  const isIframeRestricted = isHydrated && hasIframe;
  const productHref = withProductQuery(href, productSelection?.product);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasIframe) {
      e.preventDefault();
      return;
    }

    onClick?.(e);
  };

  return (
    <BaseLink
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isIframeRestricted || undefined}
      href={productHref}
      onClick={handleClick}
      {...rest}
      className={`${className}${isIframeRestricted ? ' cursor-not-allowed opacity-60' : ''}`}
      tabIndex={isIframeRestricted ? -1 : rest.tabIndex}
      title={isIframeRestricted ? '在 iframe 中不可用' : rest.title}
    >
      {children}
    </BaseLink>
  );
};

export default Link;
