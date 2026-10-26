import { useState } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import type { ListingStatus } from '@/shared/api/enums';
import { Button, ButtonLink } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { cn } from '@/shared/lib/cn';
import { useChangeListingStatus, useDeleteListing } from '../hooks/useListingMutations';
import { canEditListing, getStatusActions, type StatusAction } from '../statusTransitions';

interface OwnerActionsProps {
  listing: { id: number; title: string; status: ListingStatus };
  onDeleted?: () => void;
  layout?: 'row' | 'stack';
}

export function OwnerActions({ listing, onDeleted, layout = 'row' }: OwnerActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const changeStatus = useChangeListingStatus();
  const deleteListing = useDeleteListing();
  const isBusy = changeStatus.isPending || deleteListing.isPending;

  const handleStatusChange = async (action: StatusAction) => {
    try {
      await changeStatus.mutateAsync({ listingId: listing.id, status: action.target });
      toast.success(action.successMessage);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing.mutateAsync(listing.id);
      setIsDeleteDialogOpen(false);
      toast.success('İlan silindi');
      onDeleted?.();
    } catch (error) {
      setIsDeleteDialogOpen(false);
      toast.error(toApiError(error).message);
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
          onClick={() => void handleStatusChange(action)}
        >
          {action.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        className="text-danger hover:bg-danger-soft"
        disabled={isBusy}
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        Sil
      </Button>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="İlan silinsin mi?"
        description={`"${listing.title}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="İlanı sil"
        isConfirming={deleteListing.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
