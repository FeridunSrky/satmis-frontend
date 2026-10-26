import { useId, type Ref, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ref,
  ...textAreaProps
}: TextAreaFieldProps) {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-36 w-full rounded-md border bg-paper px-3 py-2.5 text-base transition-colors',
          'focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none',
          error ? 'border-danger' : 'border-line hover:border-ink/40',
        )}
        {...textAreaProps}
      />
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
