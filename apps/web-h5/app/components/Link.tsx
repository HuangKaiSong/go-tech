'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { useIframeContext } from '@/contexts/IframeContext';
import type { Locale } from '@/i18n/config';
import { Link as BaseLink } from '@/i18n/navigation';

type RestrictedLinkProps = ComponentProps<typeof BaseLink> & {
  children: ReactNode;
  className?: string;
  locale?: Locale;
  onClick?: () => void;
};

export const Link: React.FC<RestrictedLinkProps> = ({ children, className = '', href, onClick, ...rest }) => {
  const { hasIframe } = useIframeContext();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const selectedLayoutSegment = useSelectedLayoutSegment();
  const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : '/';
  const isActive = pathname === href;
  const isIframeRestricted = isHydrated && hasIframe;

  const handleClick = (e: React.MouseEvent) => {
    if (hasIframe) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <BaseLink
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isIframeRestricted || undefined}
      href={href}
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
