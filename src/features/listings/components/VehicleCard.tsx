import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { FuelType, GearType } from '@/shared/api/enums';
import { FUEL_TYPE_LABELS, GEAR_TYPE_LABELS } from '@/shared/config/vehicleLabels';
import { formatKilometer } from '@/shared/lib/format';
import { ListingImagePlaceholder } from './ListingImagePlaceholder';

/** The vehicle fields every card summary carries, for sale or sold. */
export interface VehicleCardSummary {
  title: string;
  brandName: string;
  modelName: string;
  seriesName: string;
  modelYear: number;
  kilometer: number;
  fuelType: FuelType;
  gearType: GearType;
  cityName: string;
  districtName: string;
  coverImageUrl: string | null;
}

interface VehicleCardProps {
  vehicle: VehicleCardSummary;
  href: string;
  /** Badges above the price, e.g. the listing status or "Satıldı". */
  badges?: ReactNode;
  price: ReactNode;
  /** Extra lines under the location, e.g. the sale date. */
  footer?: ReactNode;
  /** Owner or favourite actions rendered under the card body. */
  actions?: ReactNode;
}

/** The card frame shared by listings and sold vehicles; callers decide what the price shows. */
export function VehicleCard({ vehicle, href, badges, price, footer, actions }: VehicleCardProps) {
  const vehicleName = `${vehicle.brandName} ${vehicle.modelName} ${vehicle.seriesName}`;
  const specs = [
    String(vehicle.modelYear),
    formatKilometer(vehicle.kilometer),
    FUEL_TYPE_LABELS[vehicle.fuelType],
    GEAR_TYPE_LABELS[vehicle.gearType],
  ];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-brand-600">
      <div className="aspect-[4/3] overflow-hidden bg-surface">
        {vehicle.coverImageUrl ? (
          <img
            src={vehicle.coverImageUrl}
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
        {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
        {price}
        <h3 className="line-clamp-2 font-semibold">
          {/* The link covers the whole card; actions sit above it via z-index */}
          <Link to={href} className="after:absolute after:inset-0">
            {vehicle.title}
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
          {vehicle.cityName}, {vehicle.districtName}
        </p>
        {footer}
        {actions && <div className="relative z-10 border-t border-line pt-3">{actions}</div>}
      </div>
    </article>
  );
}
