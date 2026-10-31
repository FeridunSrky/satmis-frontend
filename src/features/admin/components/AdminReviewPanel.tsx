import { RejectionReason } from '@/features/listings/components/ApprovalStatusNotice';
import { StatusBadge } from '@/features/listings/components/StatusBadge';
import type { ListingDetail } from '@/features/listings/types';
import { formatDate, formatPhone, formatPrice } from '@/shared/lib/format';
import { ReviewActions } from './ReviewActions';

interface AdminReviewPanelProps {
  listing: ListingDetail;
  isRefreshing: boolean;
  onReload: () => void;
}

export function AdminReviewPanel({ listing, isRefreshing, onReload }: AdminReviewPanelProps) {
  const { seller } = listing;
  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-24">
      <div>
        <StatusBadge status={listing.status} />
        <p className="mt-3 font-display text-4xl font-bold text-brand-700">
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
          <dt className="text-muted">Son güncelleme</dt>
          <dd className="font-semibold">{formatDate(listing.updatedAt)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Satıcı</dt>
          <dd className="font-semibold">
            {seller.firstName} {seller.lastName}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Telefon</dt>
          <dd className="font-semibold">{seller.phone ? formatPhone(seller.phone) : '—'}</dd>
        </div>
      </dl>

      {listing.status === 'REJECTED' && (
        <div className="rounded-md border-l-4 border-danger bg-danger-soft px-4 py-3 text-sm">
          <RejectionReason reason={listing.rejectionReason} />
        </div>
      )}

      <ReviewActions listing={listing} isRefreshing={isRefreshing} onReload={onReload} />
    </aside>
  );
}
