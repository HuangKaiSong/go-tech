'use client';

import { buttonVariants } from '@go-tech-frontend/ui';
import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { enterOrStartTrial } from '@/app/lib/go-now';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialWindow } from '@/contexts/TrialWindowContext';

type TrialActionProps = Omit<ComponentProps<typeof Link>, 'href' | 'onClick'> & {
  appearance?: 'button' | 'link';
};

export function TrialAction({ appearance = 'link', children, className, ...props }: TrialActionProps) {
  const { isLoggedIn, tenants, token } = useAuth();
  const { openPmsCallback } = useTrialWindow();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) return;

    event.preventDefault();
    enterOrStartTrial({ generateCallback: openPmsCallback, tenants, token });
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
