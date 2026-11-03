import { HTTP_TOO_MANY_REQUESTS, toApiError, type ApiErrorCode } from '@/shared/api/apiError';
import { StorageUploadError } from '@/shared/api/uploadToStorage';
import { ImagePreparationError } from '@/shared/lib/prepareImage';

const UPLOAD_FAILED_MESSAGE = 'Yükleme başarısız';

const HTTP_SERVICE_UNAVAILABLE = 503;

interface UploadFailure {
  message: string;
  /** A new attempt, with a fresh upload URL, may succeed. */
  retryable: boolean;
}

/** The target's "stored file is not what was declared" code and what to tell the user then. */
interface InvalidFileRule {
  invalidCode: ApiErrorCode;
  invalidMessage: string;
}

export function toUploadFailure(error: unknown, invalidFile: InvalidFileRule): UploadFailure {
  if (error instanceof ImagePreparationError) {
    return { message: error.message, retryable: false };
  }
  // A rejected signature (403), an expired URL or a dropped connection: a new URL may work
  if (error instanceof StorageUploadError) {
    return { message: UPLOAD_FAILED_MESSAGE, retryable: true };
  }
  const apiError = toApiError(error);
  if (apiError.kind === 'network') {
    return { message: UPLOAD_FAILED_MESSAGE, retryable: true };
  }
  if (apiError.code === invalidFile.invalidCode) {
    return { message: invalidFile.invalidMessage, retryable: false };
  }
  // The *_LIMIT_REACHED codes, 400 and the e-mail/phone rules explain themselves and won't change on retry
  const retryable =
    apiError.status === HTTP_TOO_MANY_REQUESTS || apiError.status === HTTP_SERVICE_UNAVAILABLE;
  return { message: apiError.message, retryable };
}

/** Seconds to pause the queue for when the upload-URL rate limit says how long to wait. */
export function rateLimitWaitSeconds(error: unknown): number | undefined {
  const apiError = toApiError(error);
  if (apiError.kind !== 'http' || apiError.status !== HTTP_TOO_MANY_REQUESTS) {
    return undefined;
  }
  return apiError.retryAfterSeconds;
}
