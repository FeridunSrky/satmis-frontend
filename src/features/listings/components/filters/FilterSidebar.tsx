import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/lib/cn';
import { countActiveFilters } from '../../searchParams';
import { FilterPanel } from './FilterPanel';
import type { FilterGroupProps } from './filterTypes';

interface FilterSidebarProps extends FilterGroupProps {
  onClear: () => void;
  priceLabel?: string;
}

/** The filter panel, folded behind a toggle on small screens and always shown on large ones. */
export function FilterSidebar({ filters, onChange, onClear, priceLabel }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters);

  return (
    <div>
      <Button
        variant="secondary"
        fullWidth
        className="lg:hidden"
        aria-expanded={isOpen}
        aria-controls="listing-filters"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Filtreleri gizle' : 'Filtreler'}
        {activeFilterCount > 0 && ` (${activeFilterCount})`}
      </Button>
      <section
        id="listing-filters"
        aria-label="Filtreler"
        className={cn('mt-4 lg:mt-0 lg:block', !isOpen && 'hidden')}
      >
        <FilterPanel
          filters={filters}
          onChange={onChange}
          activeFilterCount={activeFilterCount}
          onClear={onClear}
          priceLabel={priceLabel}
        />
      </section>
    </div>
  );
}
