import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { OwnerActions } from '@/features/listings/components/OwnerActions';
import { useMyListings } from '@/features/listings/hooks/useListingQueries';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';
import { ButtonLink } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';

const MY_LISTINGS_PATH = '/ilanlarim';

export function MyListingsPage() {
  const [searchParams] = useSearchParams();
  const page = parsePageParam(searchParams);
  const myListingsQuery = useMyListings(page);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">İlanlarım</h1>
          <p className="mt-2 text-muted">Yayında olan, kaldırılan ve satılan tüm ilanların.</p>
        </div>
        <ButtonLink to="/ilan-ver">İlan ver</ButtonLink>
      </div>
      <div className="mt-8">
        <ListingResults
          query={myListingsQuery}
          page={page}
          hrefForPage={(nextPage) => buildPageHref(MY_LISTINGS_PATH, searchParams, nextPage)}
          renderCard={(listing) => (
            <ListingCard
              listing={listing}
              showStatus
              actions={<OwnerActions listing={listing} />}
            />
          )}
          empty={
            <StateMessage
              title="Henüz ilanın yok"
              description="Aracını birkaç dakikada ilana koyabilirsin."
            >
              <ButtonLink to="/ilan-ver">İlan ver</ButtonLink>
            </StateMessage>
          }
        />
      </div>
    </div>
  );
}
