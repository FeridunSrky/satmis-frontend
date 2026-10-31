import { Navigate, useSearchParams } from 'react-router-dom';
import { HTTP_FORBIDDEN } from '@/features/admin/adminErrors';
import { useAdminListingQueue } from '@/features/admin/hooks/useAdminListings';
import {
  DEFAULT_QUEUE_STATUS,
  parseQueueStatus,
  QUEUE_STATUSES,
  toQueueParams,
  toStatusSlug,
} from '@/features/admin/queueStatusParams';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';
import { hasStatus } from '@/shared/api/apiError';
import type { ListingStatus } from '@/shared/api/enums';
import { SelectField } from '@/shared/components/SelectField';
import { StateMessage } from '@/shared/components/StateMessage';
import { LISTING_STATUS_LABELS } from '@/shared/config/vehicleLabels';

const QUEUE_PATH = '/admin/ilanlar';
const STATUS_OPTIONS = QUEUE_STATUSES.map((status) => ({
  value: toStatusSlug(status),
  label: LISTING_STATUS_LABELS[status],
}));

export function AdminListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseQueueStatus(searchParams);
  const page = parsePageParam(searchParams);
  const queueQuery = useAdminListingQueue(status, page);

  if (hasStatus(queueQuery.error, HTTP_FORBIDDEN)) {
    return <Navigate to="/" replace />;
  }

  const handleStatusChange = (slug: string) => {
    const nextStatus = QUEUE_STATUSES.find((candidate) => toStatusSlug(candidate) === slug);
    setSearchParams(toQueueParams(nextStatus ?? DEFAULT_QUEUE_STATUS));
  };

  return (
    <section aria-labelledby="admin-listings-title">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="admin-listings-title" className="font-display text-3xl font-bold">
          İlan onayı
        </h2>
        <SelectField
          label="Durum"
          className="w-full sm:w-64"
          options={STATUS_OPTIONS}
          value={toStatusSlug(status)}
          onChange={(event) => handleStatusChange(event.target.value)}
        />
      </div>
      <ListingResults
        query={queueQuery}
        page={page}
        hrefForPage={(nextPage) => buildPageHref(QUEUE_PATH, searchParams, nextPage)}
        renderCard={(listing) => (
          <ListingCard listing={listing} showStatus href={`${QUEUE_PATH}/${listing.id}`} />
        )}
        empty={<StateMessage title={emptyTitle(status)} />}
      />
    </section>
  );
}

function emptyTitle(status: ListingStatus): string {
  return status === DEFAULT_QUEUE_STATUS
    ? 'Onay bekleyen ilan yok.'
    : `“${LISTING_STATUS_LABELS[status]}” durumunda ilan yok.`;
}
