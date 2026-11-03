import { z } from 'zod';
import { parseListingId } from '@/features/listings/listingId';
import { COMMENT_STATUSES, type CommentStatus } from '@/shared/api/enums';

export const COMMENT_QUEUE_PATH = '/admin/yorumlar';
const STATUS_PARAM = 'status';
const LISTING_PARAM = 'listingId';
export const DEFAULT_COMMENT_STATUS: CommentStatus = 'PENDING_APPROVAL';

/** The filter's wording; the badge labels ("Onay bekliyor") read oddly as a filter. */
export const COMMENT_FILTER_LABELS: Record<CommentStatus, string> = {
  PENDING_APPROVAL: 'Onay bekleyen',
  APPROVED: 'Yayında',
  REJECTED: 'Reddedilen',
};

const statusSchema = z.enum(COMMENT_STATUSES);

export interface CommentQueueFilter {
  status: CommentStatus;
  listingId: number | null;
}

/** An unknown status falls back to the pending queue; an invalid listing id is ignored. */
export function parseCommentQueueFilter(params: URLSearchParams): CommentQueueFilter {
  const status = statusSchema.safeParse(params.get(STATUS_PARAM));
  return {
    status: status.success ? status.data : DEFAULT_COMMENT_STATUS,
    listingId: parseListingId(params.get(LISTING_PARAM) ?? undefined),
  };
}

/** The default status is left out to keep links short; paging restarts on every change. */
export function toCommentQueueParams({ status, listingId }: CommentQueueFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (status !== DEFAULT_COMMENT_STATUS) {
    params.set(STATUS_PARAM, status);
  }
  if (listingId !== null) {
    params.set(LISTING_PARAM, String(listingId));
  }
  return params;
}

/** Where an admin finds a listing's published comments, e.g. to take one down. */
export function listingCommentsPath(listingId: number): string {
  const params = toCommentQueueParams({ status: 'APPROVED', listingId });
  return `${COMMENT_QUEUE_PATH}?${params.toString()}`;
}
