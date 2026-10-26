import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '@/shared/api/apiError';

export const SERVER_ERROR_KEY = 'root.server';

export interface StatusFieldError<TValues extends FieldValues> {
  field: Path<TValues>;
  /** Overrides the backend message, e.g. when it is too generic for the field. */
  message?: string;
}

export interface ServerErrorOptions<TValues extends FieldValues> {
  formFields: ReadonlyArray<Path<TValues>>;
  /** Errors that carry no field map but clearly belong to one field (e.g. 409 → email). */
  statusFields?: Partial<Record<number, StatusFieldError<TValues>>>;
}

/**
 * Writes backend field errors onto matching form fields; anything that cannot be
 * attached to a field is shown as a form-level error instead.
 */
export function applyServerErrors<TValues extends FieldValues>(
  apiError: ApiError,
  setError: UseFormSetError<TValues>,
  { formFields, statusFields = {} }: ServerErrorOptions<TValues>,
): void {
  if (apiError.kind === 'network') {
    setError(SERVER_ERROR_KEY, { message: apiError.message });
    return;
  }
  const matchedFields = Object.entries(apiError.fieldErrors).flatMap(([fieldName, message]) => {
    const field = formFields.find((candidate) => candidate === fieldName);
    return field ? [{ field, message }] : [];
  });
  const statusField = statusFields[apiError.status];
  if (matchedFields.length === 0 && statusField) {
    matchedFields.push({
      field: statusField.field,
      message: statusField.message ?? apiError.message,
    });
  }
  if (matchedFields.length === 0) {
    setError(SERVER_ERROR_KEY, { message: apiError.message });
    return;
  }
  matchedFields.forEach(({ field, message }, index) => {
    setError(field, { type: 'server', message }, { shouldFocus: index === 0 });
  });
}
