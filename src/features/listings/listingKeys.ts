import type { QueryClient } from '@tanstack/react-query';
import type { SoldVehicleFilterQuery, SoldVehicleSearchQuery } from '@/features/soldVehicles/types';
import type { ListingSearchQuery } from './types';

export const listingKeys = {
  all: ['listings'] as const,
  searches: () => [...listingKeys.all, 'search'] as const,
  search: (query: ListingSearchQuery) => [...listingKeys.searches(), query] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (listingId: number) => [...listingKeys.details(), listingId] as const,
  mineAll: () => [...listingKeys.all, 'mine'] as const,
  mine: (page: number) => [...listingKeys.mineAll(), page] as const,
};

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: (page: number) => [...favoriteKeys.all, page] as const,
};

// Kept here like favoriteKeys: selling a listing or undoing the sale changes these lists too
export const soldVehicleKeys = {
  all: ['soldVehicles'] as const,
  search: (query: SoldVehicleSearchQuery) => [...soldVehicleKeys.all, 'search', query] as const,
  summary: (query: SoldVehicleFilterQuery) => [...soldVehicleKeys.all, 'summary', query] as const,
  detail: (listingId: number) => [...soldVehicleKeys.all, 'detail', listingId] as const,
};

/** Every list a listing can appear in; refreshed after any change to a listing. */
export async function invalidateListingLists(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: listingKeys.searches() }),
    queryClient.invalidateQueries({ queryKey: listingKeys.mineAll() }),
    queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
    queryClient.invalidateQueries({ queryKey: soldVehicleKeys.all }),
  ]);
}
