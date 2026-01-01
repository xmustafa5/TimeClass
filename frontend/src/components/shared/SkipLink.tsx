'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function SkipLink({ href = '#main-content', children = 'تخطي إلى المحتوى الرئيسي' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-4 right-4 z-[100]',
        'bg-primary text-primary-foreground',
        'px-4 py-2 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200'
      )}
    >
      {children}
    </a>
  );
}
