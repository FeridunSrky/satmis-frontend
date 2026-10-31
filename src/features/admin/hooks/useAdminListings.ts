import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateListingLists, listingKeys } from '@/features/listings/listingKeys';
import { LISTINGS_PAGE_SIZE } from '@/features/listings/searchParams';
import type { ListingStatus } from '@/shared/api/enums';
import {
  approveListing,
  getAdminListing,
  getAdminListings,
  rejectListing,
} from '../api/adminListingsApi';
import { adminKeys } from '../adminKeys';

/** `page` is one-based, as in the URL. */
export function useAdminListingQueue(status: ListingStatus, page: number) {
  const query = { status, page: page - 1, size: LISTINGS_PAGE_SIZE };
  return useQuery({
    queryKey: adminKeys.listingQueue(query),
    queryFn: () => getAdminListings(query),
    placeholderData: keepPreviousData,
  });
}

export function useAdminListing(listingId: number | null) {
  return useQuery({
    queryKey: adminKeys.listing(listingId ?? 0),
    queryFn: () => getAdminListing(listingId ?? 0),
    enabled: listingId !== null,
  });
}

// A decision changes the queue, the reviewed detail and what the public sees
function useInvalidateAfterReview() {
  const queryClient = useQueryClient();
  return (listingId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.listingQueues() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.listing(listingId) }),
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) }),
      invalidateListingLists(queryClient),
    ]);
}

export function useApproveListing() {
  const invalidate = useInvalidateAfterReview();
  return useMutation({
    mutationFn: ({ listingId, version }: { listingId: number; version: number }) =>
      approveListing(listingId, { version }),
    onSuccess: (listing) => invalidate(listing.id),
  });
}

export function useRejectListing() {
  const invalidate = useInvalidateAfterReview();
  return useMutation({
    mutationFn: ({
      listingId,
      ...request
    }: {
      listingId: number;
      version: number;
      reason: string;
    }) => rejectListing(listingId, request),
    onSuccess: (listing) => invalidate(listing.id),
  });
}
