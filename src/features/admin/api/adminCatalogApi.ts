import { http } from '@/shared/api/http';
import type { CatalogItem } from '@/shared/api/types';
import type { CatalogNameRequest } from '../types';

// No Location header comes back; callers refetch the matching GET /api/catalog list instead
async function createCatalogItem(path: string, name: string): Promise<CatalogItem> {
  const request: CatalogNameRequest = { name };
  const response = await http.post<CatalogItem>(`/admin/catalog${path}`, request);
  return response.data;
}

export const createBrand = (name: string) => createCatalogItem('/brands', name);
export const createModel = (brandId: number, name: string) =>
  createCatalogItem(`/brands/${brandId}/models`, name);
export const createSeries = (modelId: number, name: string) =>
  createCatalogItem(`/models/${modelId}/series`, name);
