import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FUEL_TYPE_LABELS, GEAR_TYPE_LABELS } from '@/shared/config/vehicleLabels';
import { formatKilometer, formatPrice } from '@/shared/lib/format';
import type { ListingSummary } from '../types';
import { ListingImagePlaceholder } from './ListingImagePlaceholder';
import { StatusBadge } from './StatusBadge';

interface ListingCardProps {
  listing: ListingSummary;
  showStatus?: boolean;
  /** Owner or favourite actions rendered under the card body. */
  actions?: ReactNode;
  /** Where the card leads; the public detail page unless, e.g., the admin review opens instead. */
  href?: string;
}

export function ListingCard({ listing, showStatus = false, actions, href }: ListingCardProps) {
  const vehicleName = `${listing.brandName} ${listing.modelName} ${listing.seriesName}`;
  const specs = [
    String(listing.modelYear),
    formatKilometer(listing.kilometer),
    FUEL_TYPE_LABELS[listing.fuelType],
    GEAR_TYPE_LABELS[listing.gearType],
  ];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-brand-600">
      <div className="aspect-[4/3] overflow-hidden bg-surface">
        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={`${vehicleName} kapak görseli`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <ListingImagePlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {showStatus && (
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={listing.status} />
            {/* The summary has no reason; the detail page shows it */}
            {listing.status === 'REJECTED' && (
              <span className="text-xs text-danger">Nedenini görmek için tıklayın</span>
            )}
          </div>
        )}
        <p className="font-display text-2xl font-bold text-brand-700">
          {formatPrice(listing.price, listing.currency)}
        </p>
        <h3 className="line-clamp-2 font-semibold">
          {/* The link covers the whole card; actions sit above it via z-index */}
          <Link to={href ?? `/ilan/${listing.id}`} className="after:absolute after:inset-0">
            {listing.title}
          </Link>
        </h3>
        <p className="truncate text-sm text-muted">{vehicleName}</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Araç özeti">
          {specs.map((spec) => (
            <li key={spec} className="rounded bg-surface px-2 py-0.5 text-xs font-semibold">
              {spec}
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-2 text-sm text-muted">
          {listing.cityName}, {listing.districtName}
        </p>
        {actions && <div className="relative z-10 border-t border-line pt-3">{actions}</div>}
      </div>
    </article>
  );
}
