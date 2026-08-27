'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { type ComponentProps, type ReactNode } from 'react';
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

  const selectedLayoutSegment = useSelectedLayoutSegment();
  const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : '/';
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent) => {
    if (hasIframe) {
      e.preventDefault();
      return false;
    }

    if (onClick) {
      onClick();
    }
  };

  if (hasIframe) {
    return (
      <span className={`${className} cursor-not-allowed opacity-60`} title="在 iframe 中不可用">
        {children}
      </span>
    );
  }

  return (
    <BaseLink
      aria-current={isActive ? 'page' : undefined}
      href={href}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </BaseLink>
  );
};

export default Link;
