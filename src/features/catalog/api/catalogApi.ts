import { http } from '@/shared/api/http';
import type { CatalogItem } from '@/shared/api/types';

async function getCatalog(path: string): Promise<CatalogItem[]> {
  const response = await http.get<CatalogItem[]>(`/catalog${path}`);
  return response.data;
}

export const getBrands = () => getCatalog('/brands');
export const getModels = (brandId: number) => getCatalog(`/brands/${brandId}/models`);
export const getSeries = (modelId: number) => getCatalog(`/models/${modelId}/series`);
export const getCities = () => getCatalog('/cities');
export const getDistricts = (cityId: number) => getCatalog(`/cities/${cityId}/districts`);
