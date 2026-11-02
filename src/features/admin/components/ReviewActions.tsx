import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ListingDetail } from '@/features/listings/types';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FormAlert } from '@/shared/components/FormAlert';
import { APPROVE_CONFIRM } from '../confirmations';
import { useApproveListing, useRejectListing } from '../hooks/useAdminListings';
import { reasonFieldError, useDecisionErrors } from '../hooks/useDecisionErrors';
import { RejectDialog } from './RejectDialog';

const QUEUE_PATH = '/admin/ilanlar';

export interface DecisionControls {
  /** True while the detail reloads; deciding then could send an outdated version. */
  isRefreshing: boolean;
  onReload: () => void;
}

interface ReviewActionsProps extends DecisionControls {
  listing: Pick<ListingDetail, 'id' | 'version' | 'status'>;
}

export function ReviewActions({ listing, isRefreshing, onReload }: ReviewActionsProps) {
  const [openDialog, setOpenDialog] = useState<'approve' | 'reject'>();
  const approve = useApproveListing();
  const reject = useRejectListing();
  const navigate = useNavigate();
  const { problem, clearProblem, handleDecisionError } = useDecisionErrors(onReload);
  const isActive = listing.status === 'ACTIVE';
  const canDecide = listing.status === 'PENDING_APPROVAL' || isActive;

  const finish = (message: string) => {
    toast.success(message);
    void navigate(QUEUE_PATH);
  };

  const handleApprove = async () => {
    clearProblem();
    try {
      await approve.mutateAsync({ listingId: listing.id, version: listing.version });
      finish('İlan onaylandı');
    } catch (error) {
      handleDecisionError(error);
    } finally {
      setOpenDialog(undefined);
    }
  };

  const handleReject = async (reason: string): Promise<string | undefined> => {
    clearProblem();
    try {
      await reject.mutateAsync({ listingId: listing.id, version: listing.version, reason });
      setOpenDialog(undefined);
      finish(isActive ? 'İlan yayından kaldırıldı' : 'İlan reddedildi');
      return undefined;
    } catch (error) {
      const fieldError = reasonFieldError(error);
      if (fieldError) {
        return fieldError;
      }
      setOpenDialog(undefined);
      handleDecisionError(error);
      return undefined;
    }
  };

  const isBusy = approve.isPending || reject.isPending || isRefreshing;
  // The alert stays even when a reload shows the listing can no longer be decided on
  if (!canDecide) {
    return <FormAlert message={problem} />;
  }
  return (
    <div className="flex flex-col gap-3">
      <FormAlert message={problem} />
      {isActive ? (
        <Button variant="danger" disabled={isBusy} onClick={() => setOpenDialog('reject')}>
          Yayından kaldır
        </Button>
      ) : (
        <>
          <Button disabled={isBusy} onClick={() => setOpenDialog('approve')}>
            Onayla
          </Button>
          <Button variant="danger" disabled={isBusy} onClick={() => setOpenDialog('reject')}>
            Reddet
          </Button>
        </>
      )}
      <ConfirmDialog
        isOpen={openDialog === 'approve'}
        {...APPROVE_CONFIRM}
        isConfirming={approve.isPending}
        onConfirm={() => void handleApprove()}
        onCancel={() => setOpenDialog(undefined)}
      />
      <RejectDialog
        isOpen={openDialog === 'reject'}
        title={isActive ? 'İlanı yayından kaldır' : 'İlanı reddet'}
        submitLabel={isActive ? 'Yayından kaldır' : 'Reddet'}
        onCancel={() => setOpenDialog(undefined)}
        onSubmit={handleReject}
      />
    </div>
  );
}
