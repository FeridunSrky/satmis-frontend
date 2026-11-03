import { toApiError } from '@/shared/api/apiError';
import { uploadToStorage } from '@/shared/api/uploadToStorage';
import type { ImageUpload } from '../types';
import type { PreparedUpload, UploadedFile, UploadTarget } from './uploadTarget';

interface ImageUploadSteps<TContentType extends string> {
  /** Memoised by the caller, so a retry does not re-encode the photo. */
  prepare: () => Promise<PreparedUpload<TContentType>>;
  onUploadStarted: () => void;
  onProgress: (fraction: number) => void;
  /** The file id exists from here on; the caller must DELETE it if the upload is abandoned. */
  onReserved: (fileId: number) => void;
  signal: AbortSignal;
}

/** One attempt: prepare → reserve → PUT to storage → complete. Every attempt gets a new URL. */
export async function runImageUpload<TContentType extends string>(
  target: UploadTarget<TContentType>,
  steps: ImageUploadSteps<TContentType>,
): Promise<UploadedFile> {
  const { prepare, onUploadStarted, onReserved, signal } = steps;
  const { blob, contentType } = await prepare();
  signal.throwIfAborted();
  // The signature covers type and size, so they must describe the re-encoded blob exactly
  const upload = await target.reserve({ contentType, sizeBytes: blob.size });
  onReserved(upload.id);
  signal.throwIfAborted();
  onUploadStarted();
  await putToStorage(upload, blob, steps);
  return completeRetryingPutOnce(target, upload, blob, steps);
}

function putToStorage<TContentType extends string>(
  upload: ImageUpload,
  blob: Blob,
  steps: ImageUploadSteps<TContentType>,
): Promise<void> {
  return uploadToStorage({
    url: upload.uploadUrl,
    headers: upload.uploadHeaders,
    body: blob,
    onProgress: steps.onProgress,
    signal: steps.signal,
  });
}

// The storage may answer the PUT before the object is visible; one more PUT settles it
async function completeRetryingPutOnce<TContentType extends string>(
  target: UploadTarget<TContentType>,
  upload: ImageUpload,
  blob: Blob,
  steps: ImageUploadSteps<TContentType>,
): Promise<UploadedFile> {
  try {
    return await target.complete(upload.id);
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.kind !== 'http' || apiError.code !== target.notUploadedCode) {
      throw error;
    }
  }
  await putToStorage(upload, blob, steps);
  return target.complete(upload.id);
}
