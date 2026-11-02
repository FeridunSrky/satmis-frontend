import { useState } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import type { ListingStatus } from '@/shared/api/enums';
import { Button, ButtonLink } from '@/shared/components/Button';
import { ConfirmDialog, type ConfirmCopy } from '@/shared/components/ConfirmDialog';
import { cn } from '@/shared/lib/cn';
import { useChangeListingStatus, useDeleteListing } from '../hooks/useListingMutations';
import { canEditListing, getStatusActions, type StatusAction } from '../statusTransitions';

interface OwnerActionsProps {
  listing: { id: number; title: string; status: ListingStatus };
  onDeleted?: () => void;
  layout?: 'row' | 'stack';
}

type PendingAction = StatusAction | 'delete';

function deleteCopy(title: string): ConfirmCopy {
  return {
    title: 'İlan silinsin mi?',
    description: `"${title}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
    confirmLabel: 'İlanı sil',
    tone: 'danger',
  };
}

function isStatusAction(action: PendingAction | null): action is StatusAction {
  return action !== null && action !== 'delete';
}

export function OwnerActions({ listing, onDeleted, layout = 'row' }: OwnerActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const changeStatus = useChangeListingStatus();
  const deleteListing = useDeleteListing();
  const isBusy = changeStatus.isPending || deleteListing.isPending;

  const handleStatusChange = async (action: StatusAction) => {
    try {
      await changeStatus.mutateAsync({ listingId: listing.id, status: action.target });
      toast.success(action.successMessage);
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing.mutateAsync(listing.id);
      setPendingAction(null);
      toast.success('İlan silindi');
      onDeleted?.();
    } catch (error) {
      setPendingAction(null);
      toast.error(toApiError(error).message);
    }
  };

  const confirmPending = () => {
    if (isStatusAction(pendingAction)) {
      void handleStatusChange(pendingAction);
    } else if (pendingAction === 'delete') {
      void handleDelete();
    }
  };

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
      <Button
        variant="ghost"
        className="text-danger hover:bg-danger-soft"
        disabled={isBusy}
        onClick={() => setPendingAction('delete')}
      >
        Sil
      </Button>
      <ConfirmDialog
        isOpen={pendingAction !== null}
        {...(isStatusAction(pendingAction) ? pendingAction.confirm : deleteCopy(listing.title))}
        isConfirming={isBusy}
        onConfirm={confirmPending}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
