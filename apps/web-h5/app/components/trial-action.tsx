'use client';

import { buttonVariants } from '@go-tech-frontend/ui';
import type { ComponentProps, MouseEvent } from 'react';
import { enterOrStartTrial } from '@/app/lib/go-now';
import { useAuth } from '@/contexts/AuthContext';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import Link from './Link';

type TrialActionProps = Omit<ComponentProps<typeof Link>, 'href' | 'onClick'> & {
  appearance?: 'button' | 'link';
};

export function TrialAction({ appearance = 'link', children, className, ...props }: TrialActionProps) {
  const { isLoggedIn, token } = useAuth();
  const { product } = useProductSelection();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) return;

    event.preventDefault();

    enterOrStartTrial({ bizCode: product, tenants: [], token });
  };

  return (
    <Link
      {...props}
      href="/free-trial"
      className={appearance === 'button' ? buttonVariants({ className }) : className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
