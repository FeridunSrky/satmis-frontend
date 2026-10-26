import { CatalogSelect } from '@/features/catalog/components/CatalogSelect';
import {
  useBrands,
  useCities,
  useDistricts,
  useModels,
  useSeries,
} from '@/features/catalog/hooks/useCatalog';
import { toOptionalId, type FilterGroupProps } from './filterTypes';

export function VehicleCatalogFilters({ filters, onChange }: FilterGroupProps) {
  const brandsQuery = useBrands();
  const modelsQuery = useModels(filters.brandId);
  const seriesQuery = useSeries(filters.modelId);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 font-display text-lg font-bold">Araç</legend>
      <CatalogSelect
        label="Marka"
        query={brandsQuery}
        placeholder="Tüm markalar"
        value={filters.brandId?.toString() ?? ''}
        onChange={(event) => onChange({ brandId: toOptionalId(event.target.value) })}
      />
      <CatalogSelect
        label="Model"
        query={modelsQuery}
        placeholder="Tüm modeller"
        isParentSelected={filters.brandId !== undefined}
        parentHint="Önce marka seçin"
        value={filters.modelId?.toString() ?? ''}
        onChange={(event) => onChange({ modelId: toOptionalId(event.target.value) })}
      />
      <CatalogSelect
        label="Seri"
        query={seriesQuery}
        placeholder="Tüm seriler"
        isParentSelected={filters.modelId !== undefined}
        parentHint="Önce model seçin"
        value={filters.seriesId?.toString() ?? ''}
        onChange={(event) => onChange({ seriesId: toOptionalId(event.target.value) })}
      />
    </fieldset>
  );
}

export function LocationFilters({ filters, onChange }: FilterGroupProps) {
  const citiesQuery = useCities();
  const districtsQuery = useDistricts(filters.cityId);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 font-display text-lg font-bold">Konum</legend>
      <CatalogSelect
        label="İl"
        query={citiesQuery}
        placeholder="Tüm iller"
        value={filters.cityId?.toString() ?? ''}
        onChange={(event) => onChange({ cityId: toOptionalId(event.target.value) })}
      />
      <CatalogSelect
        label="İlçe"
        query={districtsQuery}
        placeholder="Tüm ilçeler"
        isParentSelected={filters.cityId !== undefined}
        parentHint="Önce il seçin"
        value={filters.districtId?.toString() ?? ''}
        onChange={(event) => onChange({ districtId: toOptionalId(event.target.value) })}
      />
    </fieldset>
  );
}
