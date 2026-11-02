import type { UseFormSetError } from 'react-hook-form';
import { SALE_PRICE_OUT_OF_RANGE_CODE, toApiError } from '@/shared/api/apiError';
import { applyServerErrors, SERVER_ERROR_KEY } from '@/shared/lib/formServerErrors';
import { STALE_LISTING_MESSAGE } from './saleCopy';
import type { SaleFormInput } from './saleSchema';

const HTTP_CONFLICT = 409;
const SALE_FIELDS = ['salePrice', 'note'] as const;

/** Puts a failed sale back into the panel: on the field it concerns, or above the form. */
export function applySaleError(
  error: unknown,
  setError: UseFormSetError<SaleFormInput>,
  reloadListing: () => void,
): void {
  const apiError = toApiError(error);
  if (apiError.kind === 'http' && apiError.status === HTTP_CONFLICT) {
    setError(SERVER_ERROR_KEY, { message: STALE_LISTING_MESSAGE });
    reloadListing();
    return;
  }
  // The backend's message states the allowed range, so it replaces the client-side one
  if (apiError.kind === 'http' && apiError.code === SALE_PRICE_OUT_OF_RANGE_CODE) {
    setError('salePrice', { type: 'server', message: apiError.message }, { shouldFocus: true });
    return;
  }
  applyServerErrors(apiError, setError, { formFields: SALE_FIELDS });
}
