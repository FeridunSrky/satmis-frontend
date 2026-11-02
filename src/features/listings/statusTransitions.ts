import type { ListingStatus } from '@/shared/api/enums';
import type { ConfirmCopy } from '@/shared/components/ConfirmDialog';

export interface StatusAction {
  target: ListingStatus;
  label: string;
  successMessage: string;
  confirm: ConfirmCopy;
}

const UNPUBLISH: StatusAction = {
  target: 'PASSIVE',
  label: 'Yayından kaldır',
  successMessage: 'İlan yayından kaldırıldı',
  confirm: {
    title: 'İlan yayından kaldırılsın mı?',
    description:
      'İlan aramada ve detayda başkalarına görünmeyecek. İstediğinizde tekrar yayına alabilirsiniz.',
    confirmLabel: 'Yayından kaldır',
    tone: 'danger',
  },
};
const PUBLISH: StatusAction = {
  target: 'ACTIVE',
  label: 'Yayına al',
  successMessage: 'İlan yeniden yayında',
  confirm: {
    title: 'İlan yayına alınsın mı?',
    description: 'İlan tekrar aramada görünecek.',
    confirmLabel: 'Yayına al',
    tone: 'primary',
  },
};
// Only the PATCH transitions the backend allows; anything else would come back as 422.
// Listings awaiting or failing approval leave those states through admin review or an edit only.
// Selling carries a price, so it has its own endpoint (see canMarkSold) instead of a target here.
const ALLOWED_ACTIONS: Record<ListingStatus, StatusAction[]> = {
  PENDING_APPROVAL: [],
  ACTIVE: [UNPUBLISH],
  PASSIVE: [PUBLISH],
  SOLD: [],
  REJECTED: [],
};

export function getStatusActions(status: ListingStatus): StatusAction[] {
  return ALLOWED_ACTIONS[status];
}

/** A sold listing can no longer be edited or deleted; undoing the sale comes first. */
export function canEditListing(status: ListingStatus): boolean {
  return status !== 'SOLD';
}

export function canDeleteListing(status: ListingStatus): boolean {
  return status !== 'SOLD';
}

/** Only published listings (live or paused) can be sold, through the sale panel. */
export function canMarkSold(status: ListingStatus): boolean {
  return status === 'ACTIVE' || status === 'PASSIVE';
}
