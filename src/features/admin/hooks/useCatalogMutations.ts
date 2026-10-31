import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { catalogKeys } from '@/features/catalog/hooks/useCatalog';
import type { CatalogItem } from '@/shared/api/types';
import { createBrand, createModel, createSeries } from '../api/adminCatalogApi';

// The listing form and the filters share these catalog queries, so they see new items too
function useCreateCatalogItem(create: (name: string) => Promise<CatalogItem>, listKey: QueryKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });
}

export function useCreateBrand() {
  return useCreateCatalogItem(createBrand, catalogKeys.brands());
}

export function useCreateModel(brandId: number) {
  return useCreateCatalogItem((name) => createModel(brandId, name), catalogKeys.models(brandId));
}

export function useCreateSeries(modelId: number) {
  return useCreateCatalogItem((name) => createSeries(modelId, name), catalogKeys.series(modelId));
}
