import { toast } from 'sonner';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import {
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HTTP_UNPROCESSABLE,
  useAdminActionErrorHandler,
} from '../adminErrors';

const CHANGED_WHILE_REVIEWING = 'Yorum siz incelerken değişti. Kuyruk yenilendi, tekrar inceleyin.';

/**
 * A failed comment decision. 409 and 404 mean the queue is outdated, so it is reloaded; a 422
 * explains itself (e.g. the answered comment is no longer published). Toasts, not inline
 * alerts, since the card may leave the queue with the reload.
 */
export function useCommentDecisionErrors(onReload: () => void) {
  const handleOtherError = useAdminActionErrorHandler();

  return (error: unknown) => {
    if (hasStatus(error, HTTP_CONFLICT)) {
      toast.error(CHANGED_WHILE_REVIEWING);
      onReload();
      return;
    }
    if (hasStatus(error, HTTP_NOT_FOUND) || hasStatus(error, HTTP_UNPROCESSABLE)) {
      toast.error(toApiError(error).message);
      onReload();
      return;
    }
    handleOtherError(error);
  };
}
