/** Any failed storage PUT. Its XML body is not in the API error format, so it is not parsed. */
export class StorageUploadError extends Error {
  readonly status: number | null;

  constructor(status: number | null) {
    super(
      status === null ? 'Storage upload failed (network)' : `Storage upload failed (${status})`,
    );
    this.name = 'StorageUploadError';
    this.status = status;
  }
}

interface StorageUploadOptions {
  url: string;
  headers: Record<string, string>;
  body: Blob;
  /** Fraction of the body sent so far, from 0 to 1. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

const HTTP_SUCCESS_MIN = 200;
const HTTP_SUCCESS_MAX = 299;

/**
 * PUTs a file to a signed storage URL. Deliberately not the API's axios client: the request must
 * carry exactly the signed headers, no Authorization, no cookies and no refresh retry.
 * XMLHttpRequest because fetch cannot report upload progress.
 */
export function uploadToStorage({
  url,
  headers,
  body,
  onProgress,
  signal,
}: StorageUploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.withCredentials = false;
    for (const [name, value] of Object.entries(headers)) {
      request.setRequestHeader(name, value);
    }
    const abort = () => request.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const settle = (finish: () => void) => {
      signal?.removeEventListener('abort', abort);
      finish();
    };

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    request.onload = () => {
      const succeeded = request.status >= HTTP_SUCCESS_MIN && request.status <= HTTP_SUCCESS_MAX;
      settle(() => (succeeded ? resolve() : reject(new StorageUploadError(request.status))));
    };
    request.onerror = () => settle(() => reject(new StorageUploadError(null)));
    request.onabort = () => settle(() => reject(signal?.reason ?? new StorageUploadError(null)));
    request.send(body);
  });
}
