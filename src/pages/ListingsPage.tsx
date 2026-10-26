import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilterPanel } from '@/features/listings/components/filters/FilterPanel';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { SortSelect } from '@/features/listings/components/SortSelect';
import { useListingFilters } from '@/features/listings/hooks/useListingFilters';
import { useListingSearch } from '@/features/listings/hooks/useListingQueries';
import { countActiveFilters, toListingSearchQuery } from '@/features/listings/searchParams';
import { Button } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';
import { BODY_TYPES, findBodyTypeByValue } from '@/shared/config/bodyTypes';
import { cn } from '@/shared/lib/cn';
import { formatNumber } from '@/shared/lib/format';

function chipClassName(isActive: boolean) {
  return cn(
    'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
    isActive
      ? 'border-brand-600 bg-brand-600 text-white'
      : 'border-line bg-paper text-ink hover:border-ink/40',
  );
}

export function ListingsPage() {
  const { filters, setFilters, clearFilters, hrefForFilters, hrefForPage } = useListingFilters();
  const searchQuery = useListingSearch(toListingSearchQuery(filters));
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters);
  const selectedBodyType = findBodyTypeByValue(filters.bodyType);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">
        {selectedBodyType ? `Satılık ${selectedBodyType.label} araçlar` : 'Satılık araçlar'}
      </h1>

      <nav aria-label="Kasa tipi" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              to={hrefForFilters({ bodyType: undefined })}
              className={chipClassName(!selectedBodyType)}
              aria-current={selectedBodyType ? undefined : 'page'}
            >
              Tümü
            </Link>
          </li>
          {BODY_TYPES.map((bodyType) => {
            const isActive = bodyType.value === filters.bodyType;
            return (
              <li key={bodyType.value}>
                <Link
                  to={hrefForFilters({ bodyType: bodyType.value })}
                  className={chipClassName(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {bodyType.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <div>
          <Button
            variant="secondary"
            fullWidth
            className="lg:hidden"
            aria-expanded={isFilterPanelOpen}
            aria-controls="listing-filters"
            onClick={() => setIsFilterPanelOpen((open) => !open)}
          >
            {isFilterPanelOpen ? 'Filtreleri gizle' : 'Filtreler'}
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <section
            id="listing-filters"
            aria-label="Filtreler"
            className={cn('mt-4 lg:mt-0 lg:block', !isFilterPanelOpen && 'hidden')}
          >
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              activeFilterCount={activeFilterCount}
              onClear={clearFilters}
            />
          </section>
        </div>

        <section aria-label="Arama sonuçları" className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="font-semibold text-muted" aria-live="polite">
              {searchQuery.data
                ? `${formatNumber(searchQuery.data.totalElements)} ilan bulundu`
                : ''}
            </p>
            <SortSelect value={filters.sort} onChange={(sort) => setFilters({ sort })} />
          </div>
          <ListingResults
            query={searchQuery}
            page={filters.page}
            hrefForPage={hrefForPage}
            renderCard={(listing) => <ListingCard listing={listing} />}
            empty={
              <StateMessage
                title="Aramanıza uygun ilan bulunamadı"
                description="Filtreleri gevşetmeyi ya da farklı bir kasa tipi seçmeyi deneyin."
              >
                {activeFilterCount > 0 && (
                  <Button onClick={clearFilters}>Filtreleri temizle</Button>
                )}
              </StateMessage>
            }
          />
        </section>
      </div>
    </div>
  );
}
