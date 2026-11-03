import type { ApiErrorCode } from '@/shared/api/apiError';
import type { ImageUpload } from '../types';

export interface PreparedUpload<TContentType extends string> {
  blob: Blob;
  contentType: TContentType;
}

export interface UploadedFile {
  id: number;
  url: string;
}

/**
 * Where and how picked files go: listing images and comment attachments share the upload flow
 * (reserve → PUT to storage → complete) but differ in endpoints, file types, limits and wording.
 */
export interface UploadTarget<TContentType extends string> {
  /** The exact blob to upload; throws ImagePreparationError with a message for the user. */
  prepare: (file: File) => Promise<PreparedUpload<TContentType>>;
  reserve: (request: { contentType: TContentType; sizeBytes: number }) => Promise<ImageUpload>;
  complete: (id: number) => Promise<UploadedFile>;
  discard: (id: number) => Promise<void>;
  /** `complete` found no file: one more PUT may settle it. */
  notUploadedCode: ApiErrorCode;
  /** The stored file is not what was declared; retrying cannot help. */
  invalidCode: ApiErrorCode;
  invalidMessage: string;
  maxFiles: number;
  tooManyFilesMessage: string;
  rateLimitedMessage: (waitSeconds: number) => string;
}
