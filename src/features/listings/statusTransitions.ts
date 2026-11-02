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
const MARK_SOLD: StatusAction = {
  target: 'SOLD',
  label: 'Satıldı olarak işaretle',
  successMessage: 'İlan satıldı olarak işaretlendi',
  confirm: {
    title: 'İlan satıldı olarak işaretlensin mi?',
    description: 'İlan yayından kalkacak.',
    confirmLabel: 'Satıldı olarak işaretle',
    tone: 'primary',
  },
};

// Only the transitions the backend allows; anything else would come back as 422.
// Listings awaiting or failing approval leave those states through admin review or an edit only.
const ALLOWED_ACTIONS: Record<ListingStatus, StatusAction[]> = {
  PENDING_APPROVAL: [],
  ACTIVE: [UNPUBLISH, MARK_SOLD],
  PASSIVE: [PUBLISH, MARK_SOLD],
  SOLD: [],
  REJECTED: [],
};

export function getStatusActions(status: ListingStatus): StatusAction[] {
  return ALLOWED_ACTIONS[status];
}

/** A sold listing is final and can no longer be edited. */
export function canEditListing(status: ListingStatus): boolean {
  return status !== 'SOLD';
}
