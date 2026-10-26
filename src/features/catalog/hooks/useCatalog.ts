import { useQuery } from '@tanstack/react-query';
import { getBrands, getCities, getDistricts, getModels, getSeries } from '../api/catalogApi';

// Brands, models and cities change rarely; an hour avoids refetching them on every page
const CATALOG_STALE_TIME_MS = 60 * 60 * 1000;

export const catalogKeys = {
  all: ['catalog'] as const,
  brands: () => [...catalogKeys.all, 'brands'] as const,
  models: (brandId: number | undefined) => [...catalogKeys.all, 'models', brandId] as const,
  series: (modelId: number | undefined) => [...catalogKeys.all, 'series', modelId] as const,
  cities: () => [...catalogKeys.all, 'cities'] as const,
  districts: (cityId: number | undefined) => [...catalogKeys.all, 'districts', cityId] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: catalogKeys.brands(),
    queryFn: getBrands,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useModels(brandId: number | undefined) {
  return useQuery({
    queryKey: catalogKeys.models(brandId),
    queryFn: () => getModels(requireId(brandId)),
    enabled: brandId !== undefined,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useSeries(modelId: number | undefined) {
  return useQuery({
    queryKey: catalogKeys.series(modelId),
    queryFn: () => getSeries(requireId(modelId)),
    enabled: modelId !== undefined,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useCities() {
  return useQuery({
    queryKey: catalogKeys.cities(),
    queryFn: getCities,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useDistricts(cityId: number | undefined) {
  return useQuery({
    queryKey: catalogKeys.districts(cityId),
    queryFn: () => getDistricts(requireId(cityId)),
    enabled: cityId !== undefined,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

// `enabled` guarantees the id is set; this keeps the query function honestly typed
function requireId(id: number | undefined): number {
  if (id === undefined) {
    throw new Error('Catalog query ran without its parent id');
  }
  return id;
}
