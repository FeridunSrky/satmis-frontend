import { Button } from '@/shared/components/Button';
import { VehicleCatalogFilters, LocationFilters } from './CatalogFilters';
import type { FilterGroupProps } from './filterTypes';
import { OptionFilters } from './OptionFilters';
import { RangeFilters } from './RangeFilters';

interface FilterPanelProps extends FilterGroupProps {
  activeFilterCount: number;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, activeFilterCount, onClear }: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-8 rounded-2xl border border-line bg-paper p-5">
      <VehicleCatalogFilters filters={filters} onChange={onChange} />
      <LocationFilters filters={filters} onChange={onChange} />
      <RangeFilters filters={filters} onChange={onChange} />
      <OptionFilters filters={filters} onChange={onChange} />
      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={onClear}>
          Filtreleri temizle
        </Button>
      )}
    </div>
  );
}
