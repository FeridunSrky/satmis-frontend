import type { FromWho, FuelType, GearType, VehicleCondition } from '@/shared/api/enums';
import { SelectField } from '@/shared/components/SelectField';
import {
  FROM_WHO_LABELS,
  FUEL_TYPE_LABELS,
  GEAR_TYPE_LABELS,
  toOptions,
  VEHICLE_CONDITION_LABELS,
} from '@/shared/config/vehicleLabels';
import { toOptionalEnum, type FilterGroupProps } from './filterTypes';

const DAMAGE_OPTIONS = [
  { value: 'var', label: 'Hasar kaydı var' },
  { value: 'yok', label: 'Hasar kaydı yok' },
];

function toDamageValue(hasDamageRecord: boolean | undefined): string {
  if (hasDamageRecord === undefined) {
    return '';
  }
  return hasDamageRecord ? 'var' : 'yok';
}

export function OptionFilters({ filters, onChange }: FilterGroupProps) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 font-display text-lg font-bold">Özellikler</legend>
      <SelectField
        label="Yakıt"
        placeholder="Tümü"
        options={toOptions(FUEL_TYPE_LABELS)}
        value={filters.fuelType ?? ''}
        onChange={(event) => onChange({ fuelType: toOptionalEnum<FuelType>(event.target.value) })}
      />
      <SelectField
        label="Vites"
        placeholder="Tümü"
        options={toOptions(GEAR_TYPE_LABELS)}
        value={filters.gearType ?? ''}
        onChange={(event) => onChange({ gearType: toOptionalEnum<GearType>(event.target.value) })}
      />
      <SelectField
        label="Durumu"
        placeholder="Tümü"
        options={toOptions(VEHICLE_CONDITION_LABELS)}
        value={filters.vehicleCondition ?? ''}
        onChange={(event) =>
          onChange({ vehicleCondition: toOptionalEnum<VehicleCondition>(event.target.value) })
        }
      />
      <SelectField
        label="Kimden"
        placeholder="Tümü"
        options={toOptions(FROM_WHO_LABELS)}
        value={filters.fromWho ?? ''}
        onChange={(event) => onChange({ fromWho: toOptionalEnum<FromWho>(event.target.value) })}
      />
      <SelectField
        label="Hasar kaydı"
        placeholder="Tümü"
        options={DAMAGE_OPTIONS}
        value={toDamageValue(filters.hasDamageRecord)}
        onChange={(event) =>
          onChange({
            hasDamageRecord: event.target.value === '' ? undefined : event.target.value === 'var',
          })
        }
      />
    </fieldset>
  );
}
