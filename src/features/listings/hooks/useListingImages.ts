import { IMAGE_INVALID_CODE, IMAGE_NOT_UPLOADED_CODE } from '@/shared/api/apiError';
import { prepareImage } from '@/shared/lib/prepareImage';
import {
  completeImageUpload,
  deleteImageUpload,
  requestImageUpload,
} from '../api/listingImagesApi';
import type { UploadTarget } from '../images/uploadTarget';
import { MAX_IMAGES } from '../listingLimits';
import type { ImageContentType } from '../types';
import { useFileUploads, type ExistingImage } from './useFileUploads';

export type { ExistingImage } from './useFileUploads';

const LISTING_IMAGE_TARGET: UploadTarget<ImageContentType> = {
  prepare: prepareImage,
  reserve: requestImageUpload,
  complete: completeImageUpload,
  discard: deleteImageUpload,
  notUploadedCode: IMAGE_NOT_UPLOADED_CODE,
  invalidCode: IMAGE_INVALID_CODE,
  invalidMessage: 'Dosya geçerli bir görsel değil',
  maxFiles: MAX_IMAGES,
  tooManyFilesMessage: `En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz; fazlası eklenmedi.`,
  rateLimitedMessage: (waitSeconds) =>
    `Çok fazla görsel yüklendi; ${waitSeconds} saniye sonra kendiliğinden devam edilecek.`,
};

/** Uploads picked photos right away and tracks order, cover and removals for the listing form. */
export function useListingImages(initialImages: ExistingImage[] = []) {
  return useFileUploads(LISTING_IMAGE_TARGET, initialImages);
}
