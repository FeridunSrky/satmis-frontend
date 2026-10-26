import type { QueryClient } from '@tanstack/react-query';
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

/** Every list a listing can appear in; refreshed after any change to a listing. */
export async function invalidateListingLists(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: listingKeys.searches() }),
    queryClient.invalidateQueries({ queryKey: listingKeys.mineAll() }),
    queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
  ]);
}
