import type { ReactNode } from 'react';
import { formatPrice } from '@/shared/lib/format';
import type { ListingSummary } from '../types';
import { StatusBadge } from './StatusBadge';
import { VehicleCard } from './VehicleCard';

interface ListingCardProps {
  listing: ListingSummary;
  showStatus?: boolean;
  /** Owner or favourite actions rendered under the card body. */
  actions?: ReactNode;
  /** Where the card leads; the public detail page unless, e.g., the admin review opens instead. */
  href?: string;
}

export function ListingCard({ listing, showStatus = false, actions, href }: ListingCardProps) {
  return (
    <VehicleCard
      vehicle={listing}
      href={href ?? `/ilan/${listing.id}`}
      badges={
        showStatus && (
          <>
            <StatusBadge status={listing.status} />
            {/* The summary has no reason; the detail page shows it */}
            {listing.status === 'REJECTED' && (
              <span className="text-xs text-danger">Nedenini görmek için tıklayın</span>
            )}
          </>
        )
      }
      price={
        <p className="font-display text-2xl font-bold text-brand-700">
          {formatPrice(listing.price, listing.currency)}
        </p>
      }
      actions={actions}
    />
  );
}
