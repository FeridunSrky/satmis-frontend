import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ListingDetail } from '@/features/listings/types';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { HTTP_CONFLICT, HTTP_UNPROCESSABLE, useAdminActionErrorHandler } from '../adminErrors';
import { useApproveListing, useRejectListing } from '../hooks/useAdminListings';
import { RejectDialog } from './RejectDialog';

const QUEUE_PATH = '/admin/ilanlar';
const CHANGED_WHILE_REVIEWING =
  'İlan siz incelerken değişti. Güncel hali yüklendi, lütfen tekrar inceleyin.';

interface ReviewActionsProps {
  listing: Pick<ListingDetail, 'id' | 'version' | 'status'>;
  /** True while the detail reloads; deciding then could send an outdated version. */
  isRefreshing: boolean;
  onReload: () => void;
}

export function ReviewActions({ listing, isRefreshing, onReload }: ReviewActionsProps) {
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [problem, setProblem] = useState<string>();
  const approve = useApproveListing();
  const reject = useRejectListing();
  const navigate = useNavigate();
  const handleOtherError = useAdminActionErrorHandler();
  const isActive = listing.status === 'ACTIVE';
  const canDecide = listing.status === 'PENDING_APPROVAL' || isActive;

  const finish = (message: string) => {
    toast.success(message);
    void navigate(QUEUE_PATH);
  };

  // 409 and 422 mean the detail on screen is outdated: reload it instead of retrying blindly
  const handleDecisionError = (error: unknown) => {
    if (hasStatus(error, HTTP_CONFLICT) || hasStatus(error, HTTP_UNPROCESSABLE)) {
      setProblem(
        hasStatus(error, HTTP_CONFLICT) ? CHANGED_WHILE_REVIEWING : toApiError(error).message,
      );
      onReload();
      return;
    }
    handleOtherError(error);
  };

  const handleApprove = async () => {
    setProblem(undefined);
    try {
      await approve.mutateAsync({ listingId: listing.id, version: listing.version });
      finish('İlan onaylandı');
    } catch (error) {
      handleDecisionError(error);
    }
  };

  const handleReject = async (reason: string): Promise<string | undefined> => {
    setProblem(undefined);
    try {
      await reject.mutateAsync({ listingId: listing.id, version: listing.version, reason });
      setIsRejectOpen(false);
      finish(isActive ? 'İlan yayından kaldırıldı' : 'İlan reddedildi');
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      const reasonError = apiError.kind === 'http' ? apiError.fieldErrors.reason : undefined;
      if (reasonError) {
        return reasonError;
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
