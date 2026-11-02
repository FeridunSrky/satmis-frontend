import { useState } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import type { ListingStatus } from '@/shared/api/enums';
import { Button, ButtonLink } from '@/shared/components/Button';
import { ConfirmDialog, type ConfirmCopy } from '@/shared/components/ConfirmDialog';
import { cn } from '@/shared/lib/cn';
import {
  useCancelListingSale,
  useChangeListingStatus,
  useDeleteListing,
} from '../hooks/useListingMutations';
import { RELIST_CONFIRM, RELISTED_MESSAGE, SOLD_NOT_DELETABLE_HINT } from '../sale/saleCopy';
import { SalePanel } from '../sale/SalePanel';
import {
  canDeleteListing,
  canEditListing,
  canMarkSold,
  getStatusActions,
  type StatusAction,
} from '../statusTransitions';

interface OwnerActionsProps {
  listing: { id: number; title: string; status: ListingStatus };
  onDeleted?: () => void;
  layout?: 'row' | 'stack';
}

/** The one action awaiting the owner's answer; 'sell' opens the sale panel instead. */
type PendingAction = StatusAction | 'delete' | 'relist' | 'sell';

function deleteCopy(title: string): ConfirmCopy {
  return {
    title: 'İlan silinsin mi?',
    description: `"${title}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
    confirmLabel: 'İlanı sil',
    tone: 'danger',
  };
}

function isStatusAction(action: PendingAction | null): action is StatusAction {
  return typeof action === 'object' && action !== null;
}

export function OwnerActions({ listing, onDeleted, layout = 'row' }: OwnerActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const changeStatus = useChangeListingStatus();
  const cancelSale = useCancelListingSale();
  const deleteListing = useDeleteListing();
  const isBusy = changeStatus.isPending || cancelSale.isPending || deleteListing.isPending;
  const close = () => setPendingAction(null);

  // Every confirmed action ends the same way: dialog closed, success or error toast
  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      close();
      toast.success(successMessage);
      return true;
    } catch (error) {
      close();
      toast.error(toApiError(error).message);
      return false;
    }
  };

  const confirmPending = async () => {
    if (isStatusAction(pendingAction)) {
      const { target, successMessage } = pendingAction;
      await run(
        () => changeStatus.mutateAsync({ listingId: listing.id, status: target }),
        successMessage,
      );
    } else if (pendingAction === 'relist') {
      await run(() => cancelSale.mutateAsync(listing.id), RELISTED_MESSAGE);
    } else if (pendingAction === 'delete') {
      const isDeleted = await run(() => deleteListing.mutateAsync(listing.id), 'İlan silindi');
      if (isDeleted) {
        onDeleted?.();
      }
    }
  };

  const confirmCopy = isStatusAction(pendingAction)
    ? pendingAction.confirm
    : pendingAction === 'relist'
      ? RELIST_CONFIRM
      : deleteCopy(listing.title);

  return (
    <div className={cn('flex flex-wrap gap-2', layout === 'stack' && 'flex-col')}>
      {canEditListing(listing.status) && (
        <ButtonLink to={`/ilan/${listing.id}/duzenle`} variant="secondary">
          Düzenle
        </ButtonLink>
      )}
      {getStatusActions(listing.status).map((action) => (
        <Button
          key={action.target}
          variant="secondary"
          disabled={isBusy}
          onClick={() => setPendingAction(action)}
        >
          {action.label}
        </Button>
      ))}
      {canMarkSold(listing.status) && (
        <Button variant="secondary" disabled={isBusy} onClick={() => setPendingAction('sell')}>
          Satıldı olarak işaretle
        </Button>
      )}
      {listing.status === 'SOLD' && (
        <Button variant="secondary" disabled={isBusy} onClick={() => setPendingAction('relist')}>
          Tekrar yayına al
        </Button>
      )}
      {canDeleteListing(listing.status) ? (
        <Button
          variant="ghost"
          className="text-danger hover:bg-danger-soft"
          disabled={isBusy}
          onClick={() => setPendingAction('delete')}
        >
          Sil
        </Button>
      ) : (
        <p className="text-sm text-muted">{SOLD_NOT_DELETABLE_HINT}</p>
      )}
      {pendingAction === 'sell' ? (
        <SalePanel listingId={listing.id} onClose={close} />
      ) : (
        <ConfirmDialog
          isOpen={pendingAction !== null}
          {...confirmCopy}
          isConfirming={isBusy}
          onConfirm={() => void confirmPending()}
          onCancel={close}
        />
      )}
    </div>
  );
}
