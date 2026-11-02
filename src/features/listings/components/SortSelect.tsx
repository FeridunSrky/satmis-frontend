import type { ListingSort } from '@/shared/api/enums';
import { SelectField } from '@/shared/components/SelectField';
import { LISTING_SORT_LABELS, toOptions } from '@/shared/config/vehicleLabels';

const DEFAULT_SORT: ListingSort = 'NEWEST';

interface SortSelectProps {
  value: ListingSort | undefined;
  onChange: (sort: ListingSort | undefined) => void;
  /** Same values, other wording, e.g. "En yeni satış" on the sold vehicles page. */
  labels?: Record<ListingSort, string>;
}

export function SortSelect({ value, onChange, labels = LISTING_SORT_LABELS }: SortSelectProps) {
  return (
    <SelectField
      label="Sıralama"
      className="w-full sm:w-64"
      options={toOptions(labels)}
      value={value ?? DEFAULT_SORT}
      // The default order is left out of the URL to keep links short
      onChange={(event) => {
        const sort = event.target.value as ListingSort;
        onChange(sort === DEFAULT_SORT ? undefined : sort);
      }}
    />
  );
}
