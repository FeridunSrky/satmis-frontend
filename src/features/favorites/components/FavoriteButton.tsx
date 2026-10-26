import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { formatNumber } from '@/shared/lib/format';
import { buildLoginPath } from '@/shared/lib/safeRedirect';
import { cn } from '@/shared/lib/cn';
import { useToggleFavorite } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  listingId: number;
  isFavorite: boolean;
  favoriteCount: number;
}

export function FavoriteButton({ listingId, isFavorite, favoriteCount }: FavoriteButtonProps) {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const toggleFavorite = useToggleFavorite();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate(buildLoginPath(`/ilan/${listingId}`));
      return;
    }
    toggleFavorite.mutate({ listingId, favorite: !isFavorite });
  };

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      onClick={handleClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors',
        isFavorite
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-line bg-paper text-ink hover:border-ink/40',
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.3 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.6 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {isFavorite ? 'Favorilerimde' : 'Favorilere ekle'}
      <span className="text-muted">
        {formatNumber(favoriteCount)}
        <span className="sr-only"> kişi favoriledi</span>
      </span>
    </button>
  );
}
