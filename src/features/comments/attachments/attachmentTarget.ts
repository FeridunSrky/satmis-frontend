import type { UploadTarget } from '@/features/listings/images/uploadTarget';
import { ATTACHMENT_INVALID_CODE, ATTACHMENT_NOT_UPLOADED_CODE } from '@/shared/api/apiError';
import { ImagePreparationError, prepareImage } from '@/shared/lib/prepareImage';
import {
  completeAttachmentUpload,
  deleteAttachmentUpload,
  requestAttachmentUpload,
} from '../api/commentAttachmentsApi';
import type { AttachmentContentType } from '../types';

export const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const PDF_CONTENT_TYPE = 'application/pdf';
const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ATTACHMENT_ACCEPT = [...IMAGE_CONTENT_TYPES, PDF_CONTENT_TYPE].join(',');

const TOO_LARGE_MESSAGE = 'Dosya en fazla 10 MB olabilir';
const UNSUPPORTED_MESSAGE = 'Dosya geçerli bir görsel ya da PDF değil';

/**
 * A PDF is uploaded as it is. Photos are shrunk and re-encoded like listing images, which also
 * drops their EXIF data (GPS position included), so a large phone photo is not refused up front.
 */
async function prepareAttachment(file: File) {
  if (file.type === PDF_CONTENT_TYPE) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new ImagePreparationError(TOO_LARGE_MESSAGE);
    }
    return { blob: file, contentType: PDF_CONTENT_TYPE } as const;
  }
  // A dropped file skips the picker's `accept`, so the type is checked here as well
  if (!IMAGE_CONTENT_TYPES.includes(file.type)) {
    throw new ImagePreparationError(UNSUPPORTED_MESSAGE);
  }
  return prepareImage(file);
}

export const ATTACHMENT_TARGET: UploadTarget<AttachmentContentType> = {
  prepare: prepareAttachment,
  reserve: requestAttachmentUpload,
  complete: completeAttachmentUpload,
  discard: deleteAttachmentUpload,
  notUploadedCode: ATTACHMENT_NOT_UPLOADED_CODE,
  invalidCode: ATTACHMENT_INVALID_CODE,
  invalidMessage: UNSUPPORTED_MESSAGE,
  maxFiles: MAX_ATTACHMENTS,
  tooManyFilesMessage: `En fazla ${MAX_ATTACHMENTS} dosya ekleyebilirsiniz; fazlası eklenmedi.`,
  rateLimitedMessage: (waitSeconds) =>
    `Çok fazla dosya yüklendi; ${waitSeconds} saniye sonra kendiliğinden devam edilecek.`,
};
