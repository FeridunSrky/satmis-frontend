import type { ListingStatus } from '@/shared/api/enums';
import type { ConfirmCopy } from '@/shared/components/ConfirmDialog';
import type { ListingDetail, ListingRequest } from './types';

// Messages are picked from the status the backend returned; the frontend never predicts it
const CREATED_FOR_REVIEW_MESSAGE = 'İlanınız alındı, onaylandıktan sonra yayına girecek.';
const CREATED_PUBLISHED_MESSAGE = 'İlanın yayında';
const SENT_BACK_TO_REVIEW_MESSAGE = 'İlanınız tekrar onaya gönderildi.';
const UPDATED_MESSAGE = 'İlan güncellendi';

/** States an edit can send back to admin review. */
const REVIEWABLE_AGAIN: ReadonlySet<ListingStatus> = new Set(['ACTIVE', 'PASSIVE', 'REJECTED']);

export function createdMessage(status: ListingStatus): string {
  return status === 'PENDING_APPROVAL' ? CREATED_FOR_REVIEW_MESSAGE : CREATED_PUBLISHED_MESSAGE;
}

export function updatedMessage(previous: ListingStatus, next: ListingStatus): string {
  return next === 'PENDING_APPROVAL' && REVIEWABLE_AGAIN.has(previous)
    ? SENT_BACK_TO_REVIEW_MESSAGE
    : UPDATED_MESSAGE;
}

/** Published listings go back to review when these fields change; shown before saving. */
export function isPublishedForReview(status: ListingStatus): boolean {
  return status === 'ACTIVE' || status === 'PASSIVE';
}

type ReapprovalSource = Pick<
  ListingDetail,
  'status' | 'title' | 'description' | 'price' | 'currency' | 'images'
>;
type ReapprovalChange = Pick<
  ListingRequest,
  'title' | 'description' | 'price' | 'currency' | 'imageIds'
>;

/**
 * Mirrors the backend rule for whether saving sends the listing back to admin review.
 * `request` is the validated form output, so its texts are already trimmed as sent.
 * The status the backend returns stays the final word after saving.
 */
export function needsReapproval(listing: ReapprovalSource, request: ReapprovalChange): boolean {
  if (listing.status === 'REJECTED') {
    return true;
  }
  if (!isPublishedForReview(listing.status)) {
    return false;
  }
  return (
    request.title !== listing.title ||
    (request.description ?? null) !== listing.description ||
    Number(request.price) !== listing.price ||
    request.currency !== listing.currency ||
    !hasSameImages(listing.images, request.imageIds)
  );
}

// Reordering the photos is not a content change; only the set counts
function hasSameImages(current: ListingDetail['images'], nextIds: number[]): boolean {
  const currentIds = new Set(current.map((image) => image.id));
  const nextIdSet = new Set(nextIds);
  return currentIds.size === nextIdSet.size && [...nextIdSet].every((id) => currentIds.has(id));
}

export const CREATE_CONFIRM: ConfirmCopy = {
  title: 'İlan gönderilsin mi?',
  description: 'İlanınız admin onayından sonra yayına girecek.',
  confirmLabel: 'Gönder',
  tone: 'primary',
};

export function editConfirm(sendsToReview: boolean): ConfirmCopy {
  return sendsToReview
    ? {
        title: 'Değişiklikler kaydedilsin mi?',
        description:
          'Başlık, açıklama, fiyat veya fotoğraf değiştiği için ilan tekrar admin onayına gidecek ve onaylanana kadar yayında görünmeyecek.',
        confirmLabel: 'Kaydet ve onaya gönder',
        tone: 'primary',
      }
    : {
        title: 'Değişiklikler kaydedilsin mi?',
        description: 'İlanınız güncellenecek.',
        confirmLabel: 'Kaydet',
        tone: 'primary',
      };
}
