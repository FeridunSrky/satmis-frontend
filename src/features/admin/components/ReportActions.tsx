import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ListingDetail } from '@/features/listings/types';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FormAlert } from '@/shared/components/FormAlert';
import { useDismissReports, useTakeDownListing } from '../hooks/useAdminReports';
import { reasonFieldError, useDecisionErrors } from '../hooks/useDecisionErrors';
import { RejectDialog } from './RejectDialog';
import type { DecisionControls } from './ReviewActions';

const QUEUE_PATH = '/admin/sikayetler';

interface ReportActionsProps extends DecisionControls {
  listing: Pick<ListingDetail, 'id' | 'version' | 'status'>;
  hasOpenReports: boolean;
}

export function ReportActions({
  listing,
  hasOpenReports,
  isRefreshing,
  onReload,
}: ReportActionsProps) {
  const [openDialog, setOpenDialog] = useState<'dismiss' | 'takeDown'>();
  const dismiss = useDismissReports();
  const takeDown = useTakeDownListing();
  const navigate = useNavigate();
  const { problem, clearProblem, handleDecisionError } = useDecisionErrors(onReload);
  // The backend only rejects listings that are pending or live; others can only be dismissed
  const canTakeDown = listing.status === 'ACTIVE' || listing.status === 'PENDING_APPROVAL';

  const finish = (message: string) => {
    setOpenDialog(undefined);
    toast.success(message);
    void navigate(QUEUE_PATH);
  };

  const handleDismiss = async () => {
    clearProblem();
    try {
      await dismiss.mutateAsync(listing.id);
      finish('Şikayetler yok sayıldı');
    } catch (error) {
      setOpenDialog(undefined);
      handleDecisionError(error);
    }
  };

  const handleTakeDown = async (reason: string): Promise<string | undefined> => {
    clearProblem();
    try {
      await takeDown.mutateAsync({ listingId: listing.id, version: listing.version, reason });
      finish('İlan kaldırıldı');
    } catch (error) {
      const fieldError = reasonFieldError(error);
      if (fieldError) {
        return fieldError;
      }
      setOpenDialog(undefined);
      handleDecisionError(error);
    }
    return undefined;
  };

  if (!hasOpenReports) {
    return (
      <div className="flex flex-col gap-3">
        <FormAlert message={problem} />
        <p className="text-sm text-muted">Bu ilan için açık şikayet yok.</p>
      </div>
    );
  }
  const isBusy = dismiss.isPending || takeDown.isPending || isRefreshing;
  return (
    <div className="flex flex-col gap-3">
      <FormAlert message={problem} />
      <Button variant="secondary" disabled={isBusy} onClick={() => setOpenDialog('dismiss')}>
        Şikayetleri yok say
      </Button>
      {canTakeDown ? (
        <Button variant="danger" disabled={isBusy} onClick={() => setOpenDialog('takeDown')}>
          İlanı kaldır
        </Button>
      ) : (
        <p className="text-sm text-muted">İlan yayında olmadığı için kaldırılamaz.</p>
      )}
      <ConfirmDialog
        isOpen={openDialog === 'dismiss'}
        title="Şikayetler yok sayılsın mı?"
        description="İlan yayında kalacak, açık şikayetler kapanacak."
        confirmLabel="Yok say"
        isConfirming={dismiss.isPending}
        onConfirm={() => void handleDismiss()}
        onCancel={() => setOpenDialog(undefined)}
      />
      <RejectDialog
        isOpen={openDialog === 'takeDown'}
        title="İlanı kaldır"
        submitLabel="İlanı kaldır"
        onCancel={() => setOpenDialog(undefined)}
        onSubmit={handleTakeDown}
      />
    </div>
  );
}
