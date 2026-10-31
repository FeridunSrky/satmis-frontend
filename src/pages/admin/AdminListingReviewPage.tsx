import { Link, useParams } from 'react-router-dom';
import { HTTP_NOT_FOUND } from '@/features/admin/adminErrors';
import { AdminQueryError } from '@/features/admin/components/AdminQueryError';
import { AdminReviewPanel } from '@/features/admin/components/AdminReviewPanel';
import { useAdminListing } from '@/features/admin/hooks/useAdminListings';
import { ListingDetailLayout } from '@/features/listings/components/ListingDetailLayout';
import { parseListingId } from '@/features/listings/listingId';
import { hasStatus } from '@/shared/api/apiError';
import { ButtonLink } from '@/shared/components/Button';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { StateMessage } from '@/shared/components/StateMessage';

const QUEUE_PATH = '/admin/ilanlar';

export function AdminListingReviewPage() {
  const listingId = parseListingId(useParams().id);
  const listingQuery = useAdminListing(listingId);

  if (listingId === null || hasStatus(listingQuery.error, HTTP_NOT_FOUND)) {
    return (
      <StateMessage
        title="İlan bulunamadı"
        description="İlan silinmiş ya da adres yanlış olabilir."
      >
        <ButtonLink to={QUEUE_PATH}>Kuyruğa dön</ButtonLink>
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

  return (
    <div>
      <Link to={QUEUE_PATH} className="text-sm font-semibold text-brand-700 hover:underline">
        ← Kuyruğa dön
      </Link>
      <ListingDetailLayout
        listing={listingQuery.data}
        className="mt-4"
        aside={
          <AdminReviewPanel
            listing={listingQuery.data}
            isRefreshing={listingQuery.isFetching}
            onReload={() => void listingQuery.refetch()}
          />
        }
      />
    </div>
  );
}
