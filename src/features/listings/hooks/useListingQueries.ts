import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getListing, getMyListings, searchListings } from '../api/listingsApi';
import { listingKeys } from '../listingKeys';
import { LISTINGS_PAGE_SIZE } from '../searchParams';
import type { ListingSearchQuery } from '../types';

export function useListingSearch(query: ListingSearchQuery) {
  return useQuery({
    queryKey: listingKeys.search(query),
    queryFn: () => searchListings(query),
    // Keep the old results on screen while a new filter loads instead of flashing a loader
    placeholderData: keepPreviousData,
  });
}

export function useListing(listingId: number | null) {
  return useQuery({
    queryKey: listingKeys.detail(listingId ?? 0),
    queryFn: () => getListing(listingId ?? 0),
    enabled: listingId !== null,
  });
}

/** `page` is one-based, as in the URL. */
export function useMyListings(page: number) {
  return useQuery({
    queryKey: listingKeys.mine(page),
    queryFn: () => getMyListings({ page: page - 1, size: LISTINGS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}
