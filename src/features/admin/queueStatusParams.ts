import { z } from 'zod';
import type { ListingStatus } from '@/shared/api/enums';

export const QUEUE_STATUS_PARAM = 'durum';
export const DEFAULT_QUEUE_STATUS: ListingStatus = 'PENDING_APPROVAL';

/** Turkish URL slug for each status, in the order the selector shows them. */
const STATUS_SLUGS = {
  PENDING_APPROVAL: 'onay-bekliyor',
  ACTIVE: 'yayinda',
  REJECTED: 'reddedildi',
  PASSIVE: 'yayinda-degil',
  SOLD: 'satildi',
} as const satisfies Record<ListingStatus, string>;

export const QUEUE_STATUSES = Object.keys(STATUS_SLUGS) as ListingStatus[];

const slugSchema = z.enum(Object.values(STATUS_SLUGS));

export function toStatusSlug(status: ListingStatus): string {
  return STATUS_SLUGS[status];
}

/** An unknown or missing `?durum=` falls back to the approval queue. */
export function parseQueueStatus(params: URLSearchParams): ListingStatus {
  const parsed = slugSchema.safeParse(params.get(QUEUE_STATUS_PARAM));
  if (!parsed.success) {
    return DEFAULT_QUEUE_STATUS;
  }
  return (
    QUEUE_STATUSES.find((status) => STATUS_SLUGS[status] === parsed.data) ?? DEFAULT_QUEUE_STATUS
  );
}

/** The default status is left out of the URL to keep links short; paging restarts. */
export function toQueueParams(status: ListingStatus): URLSearchParams {
  return status === DEFAULT_QUEUE_STATUS
    ? new URLSearchParams()
    : new URLSearchParams({ [QUEUE_STATUS_PARAM]: toStatusSlug(status) });
}
