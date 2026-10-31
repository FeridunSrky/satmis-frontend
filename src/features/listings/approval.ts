import type { ListingStatus } from '@/shared/api/enums';

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
