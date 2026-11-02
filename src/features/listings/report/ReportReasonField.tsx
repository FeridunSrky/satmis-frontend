import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { REPORT_REASON_LABELS, toOptions } from '@/shared/config/vehicleLabels';

const REASON_OPTIONS = toOptions(REPORT_REASON_LABELS);

interface ReportReasonFieldProps {
  registration: UseFormRegisterReturn<'reason'>;
  error?: string;
}

export function ReportReasonField({ registration, error }: ReportReasonFieldProps) {
  const errorId = useId();
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-ink">Şikayet nedeni</legend>
      {REASON_OPTIONS.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-base">
          <input
            type="radio"
            value={option.value}
            className="size-4 accent-brand-600"
            {...registration}
          />
          {option.label}
        </label>
      ))}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
