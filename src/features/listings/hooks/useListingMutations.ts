import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ListingStatus } from '@/shared/api/enums';
import {
  cancelListingSale,
  changeListingStatus,
  createListing,
  deleteListing,
  markListingSold,
  updateListing,
} from '../api/listingsApi';
import { invalidateListingLists, listingKeys } from '../listingKeys';
import type { ListingDetail, ListingRequest, MarkSoldRequest } from '../types';

function useStoreUpdatedListing() {
  const queryClient = useQueryClient();
  return (listing: ListingDetail) => {
    queryClient.setQueryData(listingKeys.detail(listing.id), listing);
    return invalidateListingLists(queryClient);
  };
}

export function useCreateListing() {
  const storeListing = useStoreUpdatedListing();
  return useMutation({ mutationFn: createListing, onSuccess: storeListing });
}

export function useUpdateListing(listingId: number) {
  const storeListing = useStoreUpdatedListing();
  return useMutation({
    mutationFn: (request: ListingRequest) => updateListing(listingId, request),
    onSuccess: storeListing,
  });
}

export function useChangeListingStatus() {
  const storeListing = useStoreUpdatedListing();
  return useMutation({
    mutationFn: ({ listingId, status }: { listingId: number; status: ListingStatus }) =>
      changeListingStatus(listingId, status),
    onSuccess: storeListing,
  });
}

export function useMarkListingSold(listingId: number) {
  const storeListing = useStoreUpdatedListing();
  return useMutation({
    mutationFn: (request: MarkSoldRequest) => markListingSold(listingId, request),
    onSuccess: storeListing,
  });
}

export function useCancelListingSale() {
  const storeListing = useStoreUpdatedListing();
  return useMutation({ mutationFn: cancelListingSale, onSuccess: storeListing });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSuccess: (_result, listingId) => {
      // Not refetched: the detail page is about to navigate away and would only get a 404
      void queryClient.invalidateQueries({
        queryKey: listingKeys.detail(listingId),
        refetchType: 'none',
      });
      return invalidateListingLists(queryClient);
    },
  });
}
