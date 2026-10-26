import type { ListingStatus } from '@/shared/api/enums';

export interface StatusAction {
  target: ListingStatus;
  label: string;
  successMessage: string;
}

const UNPUBLISH: StatusAction = {
  target: 'PASSIVE',
  label: 'Yayından kaldır',
  successMessage: 'İlan yayından kaldırıldı',
};
const PUBLISH: StatusAction = {
  target: 'ACTIVE',
  label: 'Yayına al',
  successMessage: 'İlan yeniden yayında',
};
const MARK_SOLD: StatusAction = {
  target: 'SOLD',
  label: 'Satıldı olarak işaretle',
  successMessage: 'İlan satıldı olarak işaretlendi',
};

// Only the transitions the backend allows; anything else would come back as 422
const ALLOWED_ACTIONS: Record<ListingStatus, StatusAction[]> = {
  PENDING_APPROVAL: [],
  ACTIVE: [UNPUBLISH, MARK_SOLD],
  PASSIVE: [PUBLISH, MARK_SOLD],
  SOLD: [],
};

export function getStatusActions(status: ListingStatus): StatusAction[] {
  return ALLOWED_ACTIONS[status];
}

/** A sold listing is final and can no longer be edited. */
export function canEditListing(status: ListingStatus): boolean {
  return status !== 'SOLD';
}
