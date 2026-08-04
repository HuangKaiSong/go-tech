'use client';

import { cn } from '@go-tech/utils';
import { forwardRef } from 'react';

export const Skeleton = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('animate-pulse rounded-md bg-stone-200', className)}
    {...props}
  />
));

Skeleton.displayName = 'Skeleton';
