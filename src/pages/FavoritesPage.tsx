import { useSearchParams } from 'react-router-dom';
import { RemoveFavoriteButton } from '@/features/favorites/components/RemoveFavoriteButton';
import { useMyFavorites } from '@/features/favorites/hooks/useFavorites';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';
import { ButtonLink } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';

const FAVORITES_PATH = '/favorilerim';

export function FavoritesPage() {
  const [searchParams] = useSearchParams();
  const page = parsePageParam(searchParams);
  const favoritesQuery = useMyFavorites(page);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Favorilerim</h1>
      <p className="mt-2 text-muted">
        Yayından kaldırılan ilanlar burada görünmez; yeniden yayına girdiklerinde geri gelir.
      </p>
      <div className="mt-8">
        <ListingResults
          query={favoritesQuery}
          page={page}
          hrefForPage={(nextPage) => buildPageHref(FAVORITES_PATH, searchParams, nextPage)}
          renderCard={(listing) => (
            <ListingCard
              listing={listing}
              actions={<RemoveFavoriteButton listingId={listing.id} />}
            />
          )}
          empty={
            <StateMessage
              title="Favori ilanın yok"
              description="İlan detayındaki “Favorilere ekle” ile beğendiğin araçları burada topla."
            >
              <ButtonLink to="/ilanlar">İlanlara göz at</ButtonLink>
            </StateMessage>
          }
        />
      </div>
    </div>
  );
}
