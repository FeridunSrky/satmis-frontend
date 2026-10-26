import { findBodyTypeByValue } from '@/shared/config/bodyTypes';
import {
  FROM_WHO_LABELS,
  FUEL_TYPE_LABELS,
  GEAR_TYPE_LABELS,
  TRACTION_LABELS,
  VEHICLE_CONDITION_LABELS,
} from '@/shared/config/vehicleLabels';
import { formatKilometer, formatNumber } from '@/shared/lib/format';
import type { ListingVehicle } from '../types';

function buildSpecRows(vehicle: ListingVehicle): Array<[string, string | null]> {
  return [
    ['Marka', vehicle.brandName],
    ['Model', vehicle.modelName],
    ['Seri', vehicle.seriesName],
    ['Model yılı', String(vehicle.modelYear)],
    ['Kilometre', formatKilometer(vehicle.kilometer)],
    ['Yakıt', FUEL_TYPE_LABELS[vehicle.fuelType]],
    ['Vites', GEAR_TYPE_LABELS[vehicle.gearType]],
    ['Kasa tipi', findBodyTypeByValue(vehicle.bodyType)?.label ?? null],
    ['Renk', vehicle.color],
    ['Motor gücü', vehicle.enginePower === null ? null : `${formatNumber(vehicle.enginePower)} hp`],
    [
      'Motor hacmi',
      vehicle.engineCapacity === null ? null : `${formatNumber(vehicle.engineCapacity)} cc`,
    ],
    ['Çekiş', vehicle.traction === null ? null : TRACTION_LABELS[vehicle.traction]],
    ['Durumu', VEHICLE_CONDITION_LABELS[vehicle.vehicleCondition]],
    ['Kimden', FROM_WHO_LABELS[vehicle.fromWho]],
    ['Hasar kaydı', vehicle.hasDamageRecord ? 'Var' : 'Yok'],
    ['Takas', vehicle.exchangeable ? 'Takasa uygun' : 'Takas yok'],
  ];
}

export function ListingSpecs({ vehicle }: { vehicle: ListingVehicle }) {
  // Optional fields the seller left empty are omitted rather than shown as "-"
  const rows = buildSpecRows(vehicle).filter(
    (row): row is [string, string] => row[1] !== null && row[1] !== '',
  );

  return (
    <dl className="grid grid-cols-1 divide-y divide-line rounded-xl border border-line bg-paper sm:grid-cols-2 sm:divide-y-0">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-line px-4 py-3 sm:border-b">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
