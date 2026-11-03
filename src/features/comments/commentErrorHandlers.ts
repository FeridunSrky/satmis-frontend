import { toast } from 'sonner';
import {
  COMMENT_LIMIT_REACHED_CODE,
  hasStatus,
  REPLY_LIMIT_REACHED_CODE,
  toApiError,
} from '@/shared/api/apiError';
import type { SendErrorOutcome } from './hooks/useCommentSubmission';

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

const LISTING_CLOSED_MESSAGE = 'İlan artık yorum almıyor';
const REPLY_LIMIT_MESSAGE = 'Bu yoruma cevap hakkınız kalmadı';

/** A new comment: the quota running out closes the form, a gone listing explains itself. */
export function commentSendErrorHandler(onLimitReached: (message: string) => void) {
  return (error: unknown): SendErrorOutcome => {
    const apiError = toApiError(error);
    if (apiError.kind === 'http' && apiError.code === COMMENT_LIMIT_REACHED_CODE) {
      onLimitReached(apiError.message);
      return 'handled';
    }
    if (hasStatus(error, HTTP_NOT_FOUND)) {
      return { message: LISTING_CLOSED_MESSAGE };
    }
    return undefined;
  };
}

/**
 * A reply: these answers mean the list is outdated (already replied, comment taken down), so it
 * is reloaded. The reply form goes away with the reload, hence a toast instead of a form error.
 */
export function replySendErrorHandler(onOutdated: () => void) {
  return (error: unknown): SendErrorOutcome => {
    const apiError = toApiError(error);
    const isOutdated = [HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_CONFLICT].some((status) =>
      hasStatus(error, status),
    );
    if (!isOutdated) {
      return undefined;
    }
    const isLimit = apiError.kind === 'http' && apiError.code === REPLY_LIMIT_REACHED_CODE;
    toast.error(isLimit ? REPLY_LIMIT_MESSAGE : apiError.message);
    onOutdated();
    return 'handled';
  };
}
