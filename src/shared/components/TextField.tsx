import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input frame on the right, e.g. a show-password toggle. */
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  hint,
  trailing,
  className,
  ref,
  ...inputProps
}: TextFieldProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center rounded-md border bg-paper transition-colors',
          'focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100',
          error ? 'border-danger' : 'border-line hover:border-ink/40',
        )}
      >
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-11 w-full min-w-0 rounded-md bg-transparent px-3 text-base outline-none placeholder:text-muted/70 read-only:text-muted"
          {...inputProps}
        />
        {trailing}
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
