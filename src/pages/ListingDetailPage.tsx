import { useParams } from 'react-router-dom';
import { ApprovalStatusNotice } from '@/features/listings/components/ApprovalStatusNotice';
import { ListingDetailLayout } from '@/features/listings/components/ListingDetailLayout';
import { ListingSidePanel } from '@/features/listings/components/ListingSidePanel';
import { useListing } from '@/features/listings/hooks/useListingQueries';
import { parseListingId } from '@/features/listings/listingId';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button, ButtonLink } from '@/shared/components/Button';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { StateMessage } from '@/shared/components/StateMessage';

const HTTP_NOT_FOUND = 404;

export function ListingDetailPage() {
  const listingId = parseListingId(useParams().id);
  const listingQuery = useListing(listingId);

  if (listingId === null || hasStatus(listingQuery.error, HTTP_NOT_FOUND)) {
    return <ListingNotFound />;
  }
  if (listingQuery.isPending) {
    return <FullPageLoader />;
  }
  if (listingQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <StateMessage
          tone="error"
          title="İlan yüklenemedi"
          description={toApiError(listingQuery.error).message}
        >
          <Button variant="secondary" onClick={() => void listingQuery.refetch()}>
            Tekrar dene
          </Button>
        </StateMessage>
      </div>
    );
  }

  const listing = listingQuery.data;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <ApprovalStatusNotice listing={listing} />
      <ListingDetailLayout
        listing={listing}
        aside={<ListingSidePanel listing={listing} />}
        className="mt-8 first:mt-0"
      />
    </div>
  );
}

function ListingNotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <StateMessage
        title="İlan bulunamadı"
        description="İlan kaldırılmış, satılmış ya da adres yanlış olabilir."
      >
        <ButtonLink to="/ilanlar">İlanlara göz at</ButtonLink>
      </StateMessage>
    </div>
  );
}
