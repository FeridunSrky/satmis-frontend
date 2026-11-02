import type { ReactNode } from 'react';
import { SaleFacts } from '@/features/listings/sale/SaleFacts';
import { formatDate } from '@/shared/lib/format';
import type { SoldVehicleDetail } from '../types';

interface SoldVehicleAsideProps {
  vehicle: SoldVehicleDetail;
  /** Admin-only controls; nobody else gets any action here. */
  actions?: ReactNode;
}

/** No seller, phone, favourite or report: a sold vehicle is a price record, not an offer. */
export function SoldVehicleAside({ vehicle, actions }: SoldVehicleAsideProps) {
  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-24">
      <div>
        <span className="inline-flex items-center rounded-full bg-asphalt px-2.5 py-0.5 text-xs font-semibold text-white">
          Satıldı
        </span>
        <h1 className="mt-3 text-xl leading-snug font-semibold">{vehicle.title}</h1>
        <p className="mt-2 text-muted">
          {vehicle.location.cityName}, {vehicle.location.districtName}
        </p>
      </div>
      <div className="border-y border-line py-4">
        <SaleFacts
          salePrice={vehicle.salePrice}
          listingPrice={vehicle.listingPrice}
          currency={vehicle.currency}
          soldAt={vehicle.soldAt}
          note={vehicle.saleNote}
        />
      </div>
      <p className="text-sm text-muted">İlan tarihi: {formatDate(vehicle.createdAt)}</p>
      {actions}
    </aside>
  );
}
