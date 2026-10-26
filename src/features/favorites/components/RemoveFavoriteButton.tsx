import { Button } from '@/shared/components/Button';
import { useToggleFavorite } from '../hooks/useFavorites';

export function RemoveFavoriteButton({ listingId }: { listingId: number }) {
  const toggleFavorite = useToggleFavorite();
  return (
    <Button
      variant="secondary"
      fullWidth
      disabled={toggleFavorite.isPending}
      onClick={() => toggleFavorite.mutate({ listingId, favorite: false })}
    >
      {toggleFavorite.isPending ? 'Gönderiliyor...' : 'Favoriden çıkar'}
    </Button>
  );
}
