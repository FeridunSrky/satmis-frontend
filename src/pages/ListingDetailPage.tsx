import { useParams } from 'react-router-dom';
import { ListingGallery } from '@/features/listings/components/ListingGallery';
import { ListingSidePanel } from '@/features/listings/components/ListingSidePanel';
import { ListingSpecs } from '@/features/listings/components/ListingSpecs';
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
  // One panel in the DOM: under the photos on small screens, a sticky sidebar on large ones
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="min-w-0 lg:col-start-1">
        <ListingGallery images={listing.images} title={listing.title} />
      </div>
      <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-stretch">
        <ListingSidePanel listing={listing} />
      </div>
      {listing.description && (
        <section aria-labelledby="description-title" className="min-w-0 lg:col-start-1">
          <h2 id="description-title" className="font-display text-2xl font-bold">
            Açıklama
          </h2>
          <p className="mt-3 whitespace-pre-line text-ink/90">{listing.description}</p>
        </section>
      )}
      <section aria-labelledby="specs-title" className="min-w-0 lg:col-start-1">
        <h2 id="specs-title" className="mb-3 font-display text-2xl font-bold">
          Araç bilgileri
        </h2>
        <ListingSpecs vehicle={listing.vehicle} />
      </section>
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
