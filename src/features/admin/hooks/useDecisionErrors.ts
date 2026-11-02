import { useState } from 'react';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { HTTP_CONFLICT, HTTP_UNPROCESSABLE, useAdminActionErrorHandler } from '../adminErrors';

export const CHANGED_WHILE_REVIEWING =
  'İlan siz incelerken değişti. Güncel hali yüklendi, lütfen tekrar inceleyin.';

/** A backend `errors.reason`, which belongs under the reason field of the dialog. */
export function reasonFieldError(error: unknown): string | undefined {
  const apiError = toApiError(error);
  return apiError.kind === 'http' ? apiError.fieldErrors.reason : undefined;
}

/**
 * Error handling shared by every admin decision on a listing. 409 and 422 mean the screen
 * is outdated, so the data is reloaded and the reason stays visible instead of a retry.
 */
export function useDecisionErrors(onReload: () => void) {
  const [problem, setProblem] = useState<string>();
  const handleOtherError = useAdminActionErrorHandler();

  const handleDecisionError = (error: unknown) => {
    if (hasStatus(error, HTTP_CONFLICT) || hasStatus(error, HTTP_UNPROCESSABLE)) {
      setProblem(
        hasStatus(error, HTTP_CONFLICT) ? CHANGED_WHILE_REVIEWING : toApiError(error).message,
      );
      onReload();
      return;
    }
    handleOtherError(error);
  };

  return { problem, clearProblem: () => setProblem(undefined), handleDecisionError };
}
