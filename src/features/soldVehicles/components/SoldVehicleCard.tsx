import { VehicleCard } from '@/features/listings/components/VehicleCard';
import { describePriceDifference } from '@/features/listings/sale/salePrice';
import { formatDate, formatPrice } from '@/shared/lib/format';
import { soldVehiclePath } from '../soldVehiclePaths';
import type { SoldVehicleSummary } from '../types';

/** The sale price leads; the asking price is context, not a struck-out "old price". */
export function SoldVehicleCard({ vehicle }: { vehicle: SoldVehicleSummary }) {
  return (
    <VehicleCard
      vehicle={vehicle}
      href={soldVehiclePath(vehicle.id)}
      badges={
        <span className="inline-flex items-center rounded-full bg-asphalt px-2.5 py-0.5 text-xs font-semibold text-white">
          Satıldı
        </span>
      }
      price={
        <div>
          <p className="font-display text-2xl font-bold text-brand-700">
            {formatPrice(vehicle.salePrice, vehicle.currency)}
          </p>
          <p className="text-sm text-muted">
            İlan fiyatı: {formatPrice(vehicle.listingPrice, vehicle.currency)} ·{' '}
            {describePriceDifference(vehicle.listingPrice, vehicle.salePrice)}
          </p>
        </div>
      }
      footer={<p className="text-sm text-muted">Satış tarihi: {formatDate(vehicle.soldAt)}</p>}
    />
  );
}
