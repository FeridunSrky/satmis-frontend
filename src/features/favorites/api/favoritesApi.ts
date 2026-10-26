import type { ListingSummary } from '@/features/listings/types';
import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';

// Both write endpoints are idempotent, which is what makes optimistic toggling safe
export async function addFavorite(listingId: number): Promise<void> {
  await http.put(`/listings/${listingId}/favorite`);
}

export async function removeFavorite(listingId: number): Promise<void> {
  await http.delete(`/listings/${listingId}/favorite`);
}

export async function getMyFavorites(query: {
  page: number;
  size: number;
}): Promise<PageResponse<ListingSummary>> {
  const response = await http.get<PageResponse<ListingSummary>>('/users/me/favorites', {
    params: query,
  });
  return response.data;
}
