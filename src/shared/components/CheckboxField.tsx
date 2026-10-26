import { useId, type InputHTMLAttributes, type Ref } from 'react';

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string;
  ref?: Ref<HTMLInputElement>;
}

export function CheckboxField({ label, ref, ...inputProps }: CheckboxFieldProps) {
  const inputId = useId();
  return (
    <div className="flex items-center gap-3">
      <input
        id={inputId}
        ref={ref}
        type="checkbox"
        className="size-5 shrink-0 rounded border-line accent-brand-600"
        {...inputProps}
      />
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
    </div>
  );
}
