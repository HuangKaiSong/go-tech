'use client'

import { useIframeContext } from "@/contexts/IframeContext";
import BaseLink, { LinkProps } from "next/link";
import { ReactNode } from "react";

type RestrictedLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export const Link: React.FC<RestrictedLinkProps> = ({
  children,
  href,
  onClick,
  className = "",
  ...rest
}) => {
  const { hasIframe } = useIframeContext();

  const handleClick = (e: React.MouseEvent) => {
    if (hasIframe) {
      e.preventDefault();
      console.warn("在 iframe 中链接点击被阻止");
      return false;
    }

    if (onClick) {
      onClick();
    }
  };

  if (hasIframe) {
    return (
      <span
        className={`${className} cursor-not-allowed opacity-60`}
        title="在 iframe 中不可用"
      >
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
