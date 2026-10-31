import { HTTP_TOO_MANY_REQUESTS, IMAGE_INVALID_CODE, toApiError } from '@/shared/api/apiError';
import { StorageUploadError } from '@/shared/api/uploadToStorage';
import { ImagePreparationError } from '@/shared/lib/prepareImage';

const UPLOAD_FAILED_MESSAGE = 'Yükleme başarısız';
const INVALID_IMAGE_MESSAGE = 'Dosya geçerli bir görsel değil';

const HTTP_SERVICE_UNAVAILABLE = 503;

interface UploadFailure {
  message: string;
  /** A new attempt, with a fresh upload URL, may succeed. */
  retryable: boolean;
}

export function toUploadFailure(error: unknown): UploadFailure {
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
  if (apiError.code === IMAGE_INVALID_CODE) {
    return { message: INVALID_IMAGE_MESSAGE, retryable: false };
  }
  // IMAGE_LIMIT_REACHED, 400 and the e-mail/phone rules explain themselves and won't change on retry
  const retryable =
    apiError.status === HTTP_TOO_MANY_REQUESTS || apiError.status === HTTP_SERVICE_UNAVAILABLE;
  return { message: apiError.message, retryable };
}
