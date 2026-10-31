import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface NoticeProps {
  tone?: 'info' | 'danger';
  title?: string;
  children?: ReactNode;
  className?: string;
}

const toneClassNames = {
  info: 'border-brand-600 bg-brand-50',
  danger: 'border-danger bg-danger-soft',
} as const;

/** A persistent, non-interrupting message box; use FormAlert for errors that need attention. */
export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  return (
    <section
      aria-label={title}
      className={cn('rounded-md border-l-4 px-4 py-3 text-sm', toneClassNames[tone], className)}
    >
      {title && <p className={cn('font-semibold', tone === 'danger' && 'text-danger')}>{title}</p>}
      {children && <div className={cn(title && 'mt-1')}>{children}</div>}
    </section>
  );
}
