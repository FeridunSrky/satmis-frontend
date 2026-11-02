import { normalizeKeyword } from '@/features/listings/keyword';
import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import type {
  SalePriceSummary,
  SoldVehicleDetail,
  SoldVehicleFilterQuery,
  SoldVehicleSearchQuery,
  SoldVehicleSummary,
} from '../types';

// Public endpoints; `http` attaches a token when there is one, which they simply ignore
export async function searchSoldVehicles(
  query: SoldVehicleSearchQuery,
): Promise<PageResponse<SoldVehicleSummary>> {
  const params = { ...query, q: normalizeKeyword(query.q) };
  const response = await http.get<PageResponse<SoldVehicleSummary>>('/sold-vehicles', { params });
  return response.data;
}

export async function getSalePriceSummary(
  query: SoldVehicleFilterQuery,
): Promise<SalePriceSummary> {
  const params = { ...query, q: normalizeKeyword(query.q) };
  const response = await http.get<SalePriceSummary>('/sold-vehicles/summary', { params });
  return response.data;
}

export async function getSoldVehicle(listingId: number): Promise<SoldVehicleDetail> {
  const response = await http.get<SoldVehicleDetail>(`/sold-vehicles/${listingId}`);
  return response.data;
}
