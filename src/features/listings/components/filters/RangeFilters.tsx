import type { SubmitEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { TextField } from '@/shared/components/TextField';
import { CURRENCY_LABELS, toOptions } from '@/shared/config/vehicleLabels';
import { FILTER_PARAM_NAMES, parseListingFilters, type FilterPatch } from '../../searchParams';
import type { FilterGroupProps } from './filterTypes';

const RANGE_KEYS = ['minPrice', 'maxPrice', 'currency', 'minYear', 'maxYear', 'maxKm'] as const;

/**
 * Typed values are applied together with one button instead of on every keystroke,
 * which would fire a search request per digit.
 */
export function RangeFilters({ filters, onChange }: FilterGroupProps) {
  // Remounting on URL change keeps the inputs in sync after "Filtreleri temizle" or Back
  const formKey = RANGE_KEYS.map((key) => filters[key] ?? '').join('|');

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formParams = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      if (typeof value === 'string') {
        formParams.set(name, value);
      }
    }
    // Same validation as the URL: invalid numbers are dropped rather than sent
    const parsed = parseListingFilters(formParams);
    // Every range key is set, even to undefined, so cleared inputs remove their filter
    const patch = Object.fromEntries(RANGE_KEYS.map((key) => [key, parsed[key]])) as FilterPatch;
    onChange(patch);
  };

  return (
    <form
      key={formKey}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      aria-label="Fiyat, yıl ve kilometre"
    >
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="mb-3 font-display text-lg font-bold">Fiyat</legend>
        <TextField
          label="En az"
          name={FILTER_PARAM_NAMES.minPrice}
          inputMode="numeric"
          defaultValue={filters.minPrice ?? ''}
        />
        <TextField
          label="En çok"
          name={FILTER_PARAM_NAMES.maxPrice}
          inputMode="numeric"
          defaultValue={filters.maxPrice ?? ''}
        />
        <SelectField
          className="col-span-2"
          label="Para birimi"
          name={FILTER_PARAM_NAMES.currency}
          placeholder="Tümü"
          options={toOptions(CURRENCY_LABELS)}
          defaultValue={filters.currency ?? ''}
          hint="Fiyat filtresi kur çevirmez; para birimiyle birlikte kullanın."
        />
      </fieldset>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="mb-3 font-display text-lg font-bold">Model yılı</legend>
        <TextField
          label="En eski"
          name={FILTER_PARAM_NAMES.minYear}
          inputMode="numeric"
          defaultValue={filters.minYear ?? ''}
        />
        <TextField
          label="En yeni"
          name={FILTER_PARAM_NAMES.maxYear}
          inputMode="numeric"
          defaultValue={filters.maxYear ?? ''}
        />
      </fieldset>
      <TextField
        label="En fazla kilometre"
        name={FILTER_PARAM_NAMES.maxKm}
        inputMode="numeric"
        defaultValue={filters.maxKm ?? ''}
      />
      <Button type="submit" variant="secondary">
        Aralıkları uygula
      </Button>
    </form>
  );
}
