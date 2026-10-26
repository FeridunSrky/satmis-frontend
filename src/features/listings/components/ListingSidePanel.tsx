import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { formatDate, formatNumber, formatPrice } from '@/shared/lib/format';
import type { ListingDetail } from '../types';
import { OwnerActions } from './OwnerActions';
import { StatusBadge } from './StatusBadge';

export function ListingSidePanel({ listing }: { listing: ListingDetail }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const navigate = useNavigate();
  const isOwner = currentUserId === listing.seller.id;

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-24">
      <div>
        <p className="font-display text-4xl font-bold text-brand-700">
          {formatPrice(listing.price, listing.currency)}
        </p>
        <h1 className="mt-2 text-xl leading-snug font-semibold">{listing.title}</h1>
        <p className="mt-2 text-muted">
          {listing.location.cityName}, {listing.location.districtName}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-y border-line py-4 text-sm">
        <div>
          <dt className="text-muted">İlan tarihi</dt>
          <dd className="font-semibold">{formatDate(listing.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Görüntülenme</dt>
          <dd className="font-semibold">{formatNumber(listing.viewCount)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Satıcı</dt>
          <dd className="font-semibold">
            {listing.seller.firstName} {listing.seller.lastName}
          </dd>
        </div>
      </dl>

      <FavoriteButton
        listingId={listing.id}
        isFavorite={listing.favoritedByMe}
        favoriteCount={listing.favoriteCount}
      />

      {isOwner && (
        <section aria-labelledby="owner-actions-title" className="rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="owner-actions-title" className="font-semibold">
              İlanını yönet
            </h2>
            <StatusBadge status={listing.status} />
          </div>
          <div className="mt-4">
            <OwnerActions
              listing={listing}
              layout="stack"
              onDeleted={() => navigate('/ilanlarim', { replace: true })}
            />
          </div>
        </section>
      )}
    </aside>
  );
}
