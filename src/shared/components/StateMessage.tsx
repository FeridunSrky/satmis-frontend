import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface StateMessageProps {
  title: string;
  description?: string;
  /** Errors are announced to screen readers; empty states are not. */
  tone?: 'empty' | 'error';
  children?: ReactNode;
  className?: string;
}

/** Shared frame for empty, not-found and error states of a data fetch. */
export function StateMessage({
  title,
  description,
  tone = 'empty',
  children,
  className,
}: StateMessageProps) {
  return (
    <section
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed bg-paper px-6 py-14 text-center',
        tone === 'error' ? 'border-danger/40' : 'border-ink/25',
        className,
      )}
    >
      <span aria-hidden="true" className="lane-dashes h-1 w-24" />
      <h2 className="mt-6 font-display text-3xl font-bold">{title}</h2>
      {description && <p className="mt-3 max-w-md text-muted">{description}</p>}
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </section>
  );
}
