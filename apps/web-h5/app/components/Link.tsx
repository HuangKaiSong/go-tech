'use client';

import BaseLink, { type LinkProps } from 'next/link';
import { type ReactNode } from 'react';
import { useIframeContext } from '@/contexts/IframeContext';

type RestrictedLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export const Link: React.FC<RestrictedLinkProps> = ({ children, className = '', href, onClick, ...rest }) => {
  const { hasIframe } = useIframeContext();

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
    <BaseLink href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </BaseLink>
  );
};

export default Link;
