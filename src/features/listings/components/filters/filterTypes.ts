import type { FilterPatch, ListingFilters } from '../../searchParams';

export interface FilterGroupProps {
  filters: ListingFilters;
  onChange: (patch: FilterPatch) => void;
}

/** Select value → catalog id; the empty option means "no filter". */
export function toOptionalId(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

export function toOptionalEnum<TValue extends string>(value: string): TValue | undefined {
  return value === '' ? undefined : (value as TValue);
}
