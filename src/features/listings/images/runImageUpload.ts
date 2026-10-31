import { IMAGE_NOT_UPLOADED_CODE, toApiError } from '@/shared/api/apiError';
import { uploadToStorage } from '@/shared/api/uploadToStorage';
import type { PreparedImage } from '@/shared/lib/prepareImage';
import { completeImageUpload, requestImageUpload } from '../api/listingImagesApi';
import type { ImageUpload, UploadedImage } from '../types';

interface ImageUploadSteps {
  /** Memoised by the caller, so a retry does not re-encode the photo. */
  prepare: () => Promise<PreparedImage>;
  onUploadStarted: () => void;
  onProgress: (fraction: number) => void;
  /** The image id exists from here on; the caller must DELETE it if the upload is abandoned. */
  onReserved: (imageId: number) => void;
  signal: AbortSignal;
}

/** One attempt: prepare → reserve → PUT to storage → complete. Every attempt gets a new URL. */
export async function runImageUpload(steps: ImageUploadSteps): Promise<UploadedImage> {
  const { prepare, onUploadStarted, onReserved, signal } = steps;
  const { blob, contentType } = await prepare();
  signal.throwIfAborted();
  // The signature covers type and size, so they must describe the re-encoded blob exactly
  const upload = await requestImageUpload({ contentType, sizeBytes: blob.size });
  onReserved(upload.id);
  signal.throwIfAborted();
  onUploadStarted();
  await putToStorage(upload, blob, steps);
  return completeRetryingPutOnce(upload, blob, steps);
}

function putToStorage(upload: ImageUpload, blob: Blob, steps: ImageUploadSteps): Promise<void> {
  return uploadToStorage({
    url: upload.uploadUrl,
    headers: upload.uploadHeaders,
    body: blob,
    onProgress: steps.onProgress,
    signal: steps.signal,
  });
}

// The storage may answer the PUT before the object is visible; one more PUT settles it
async function completeRetryingPutOnce(
  upload: ImageUpload,
  blob: Blob,
  steps: ImageUploadSteps,
): Promise<UploadedImage> {
  try {
    return await completeImageUpload(upload.id);
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.kind !== 'http' || apiError.code !== IMAGE_NOT_UPLOADED_CODE) {
      throw error;
    }
  }
  await putToStorage(upload, blob, steps);
  return completeImageUpload(upload.id);
}
