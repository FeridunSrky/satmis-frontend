import { FilterSidebar } from '@/features/listings/components/filters/FilterSidebar';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { ListingSearchForm } from '@/features/listings/components/ListingSearchForm';
import { SortSelect } from '@/features/listings/components/SortSelect';
import { useListingFilters } from '@/features/listings/hooks/useListingFilters';
import { toListingSearchQuery } from '@/features/listings/searchParams';
import { SalePriceSummaryCard } from '@/features/soldVehicles/components/SalePriceSummaryCard';
import { SoldVehicleCard } from '@/features/soldVehicles/components/SoldVehicleCard';
import {
  useSalePriceSummary,
  useSoldVehicleSearch,
} from '@/features/soldVehicles/hooks/useSoldVehicles';
import { SOLD_VEHICLES_PATH } from '@/features/soldVehicles/soldVehiclePaths';
import { toSoldVehicleFilterQuery } from '@/features/soldVehicles/types';
import { Button } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';
import { SOLD_VEHICLE_SORT_LABELS } from '@/shared/config/vehicleLabels';
import { formatNumber } from '@/shared/lib/format';

export function SoldVehiclesPage() {
  const { filters, setFilters, clearFilters, clearAll, hrefForPage } =
    useListingFilters(SOLD_VEHICLES_PATH);
  const searchQuery = toListingSearchQuery(filters);
  const soldQuery = useSoldVehicleSearch(searchQuery);
  const summaryQuery = useSalePriceSummary(toSoldVehicleFilterQuery(searchQuery));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Satılmış araçlar</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Sitemizde satılan araçların gerçekleşen satış fiyatları. Satıcı bilgisi paylaşılmaz.
      </p>

      <ListingSearchForm
        className="mt-6 max-w-2xl"
        keyword={filters.q}
        onSearch={(keyword) => setFilters({ q: keyword })}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          priceLabel="Satış fiyatı"
        />

        <section aria-label="Satılmış araçlar" className="flex min-w-0 flex-col gap-5">
          <SalePriceSummaryCard query={summaryQuery} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="font-semibold text-muted" aria-live="polite">
              {soldQuery.data ? `${formatNumber(soldQuery.data.totalElements)} satış` : ''}
            </p>
            <SortSelect
              value={filters.sort}
              onChange={(sort) => setFilters({ sort })}
              labels={SOLD_VEHICLE_SORT_LABELS}
            />
          </div>
          <ListingResults
            query={soldQuery}
            page={filters.page}
            hrefForPage={hrefForPage}
            renderCard={(vehicle) => <SoldVehicleCard vehicle={vehicle} />}
            errorTitle="Satılmış araçlar yüklenemedi"
            empty={
              <StateMessage title="Bu filtrelerle satılmış araç bulunamadı.">
                <Button variant="secondary" onClick={clearAll}>
                  Tüm filtreleri temizle
                </Button>
              </StateMessage>
            }
          />
        </section>
      </div>
    </div>
  );
}
