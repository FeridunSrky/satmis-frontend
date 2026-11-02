import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ListingDetailLayout } from '@/features/listings/components/ListingDetailLayout';
import type { ListingDetail } from '@/features/listings/types';
import { hasStatus } from '@/shared/api/apiError';
import { ButtonLink } from '@/shared/components/Button';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { StateMessage } from '@/shared/components/StateMessage';
import { HTTP_NOT_FOUND } from '../adminErrors';
import { useAdminListing } from '../hooks/useAdminListings';
import { AdminQueryError } from './AdminQueryError';
import { AdminReviewPanel } from './AdminReviewPanel';
import type { DecisionControls } from './ReviewActions';

interface AdminListingReviewProps {
  listingId: number | null;
  /** The queue this review was opened from. */
  backPath: string;
  renderActions: (listing: ListingDetail, controls: DecisionControls) => ReactNode;
  /** Shown under the listing, e.g. its reports. */
  children?: ReactNode;
}

/** A listing as an admin reviews it: every state, seller phone, and the decisions on offer. */
export function AdminListingReview({
  listingId,
  backPath,
  renderActions,
  children,
}: AdminListingReviewProps) {
  const listingQuery = useAdminListing(listingId);

  if (listingId === null || hasStatus(listingQuery.error, HTTP_NOT_FOUND)) {
    return (
      <StateMessage
        title="İlan bulunamadı"
        description="İlan silinmiş ya da adres yanlış olabilir."
      >
        <ButtonLink to={backPath}>Kuyruğa dön</ButtonLink>
      </StateMessage>
    );
  }
  if (listingQuery.isPending) {
    return <FullPageLoader />;
  }
  if (listingQuery.isError) {
    return (
      <AdminQueryError
        error={listingQuery.error}
        title="İlan yüklenemedi"
        onRetry={() => void listingQuery.refetch()}
      />
    );
  }

  const controls: DecisionControls = {
    isRefreshing: listingQuery.isFetching,
    onReload: () => void listingQuery.refetch(),
  };
  return (
    <div>
      <Link to={backPath} className="text-sm font-semibold text-brand-700 hover:underline">
        ← Kuyruğa dön
      </Link>
      <ListingDetailLayout
        listing={listingQuery.data}
        className="mt-4"
        aside={
          <AdminReviewPanel
            listing={listingQuery.data}
            actions={renderActions(listingQuery.data, controls)}
          />
        }
      />
      {children}
    </div>
  );
}
