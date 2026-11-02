import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ListingDetail } from '@/features/listings/types';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
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
  const [isRejectOpen, setIsRejectOpen] = useState(false);
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
    }
  };

  const handleReject = async (reason: string): Promise<string | undefined> => {
    clearProblem();
    try {
      await reject.mutateAsync({ listingId: listing.id, version: listing.version, reason });
      setIsRejectOpen(false);
      finish(isActive ? 'İlan yayından kaldırıldı' : 'İlan reddedildi');
      return undefined;
    } catch (error) {
      const fieldError = reasonFieldError(error);
      if (fieldError) {
        return fieldError;
      }
      setIsRejectOpen(false);
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
        <Button variant="danger" disabled={isBusy} onClick={() => setIsRejectOpen(true)}>
          Yayından kaldır
        </Button>
      ) : (
        <>
          <Button disabled={isBusy} onClick={() => void handleApprove()}>
            Onayla
          </Button>
          <Button variant="danger" disabled={isBusy} onClick={() => setIsRejectOpen(true)}>
            Reddet
          </Button>
        </>
      )}
      <RejectDialog
        isOpen={isRejectOpen}
        title={isActive ? 'İlanı yayından kaldır' : 'İlanı reddet'}
        submitLabel={isActive ? 'Yayından kaldır' : 'Reddet'}
        onCancel={() => setIsRejectOpen(false)}
        onSubmit={handleReject}
      />
    </div>
  );
}
