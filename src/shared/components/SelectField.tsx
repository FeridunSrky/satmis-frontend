import { useId, type Ref, type SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  options: ReadonlyArray<SelectOption>;
  /** Empty first option, e.g. "Tümü" in filters or "Seçin" in forms. */
  placeholder?: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function SelectField({
  label,
  options,
  placeholder,
  error,
  hint,
  className,
  ref,
  ...selectProps
}: SelectFieldProps) {
  const selectId = useId();
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={selectId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <select
        id={selectId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 w-full min-w-0 rounded-md border bg-paper px-3 text-base transition-colors',
          'focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted',
          error ? 'border-danger' : 'border-line hover:border-ink/40',
        )}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
