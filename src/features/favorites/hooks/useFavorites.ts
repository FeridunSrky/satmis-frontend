import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { favoriteKeys, listingKeys } from '@/features/listings/listingKeys';
import { LISTINGS_PAGE_SIZE } from '@/features/listings/searchParams';
import type { ListingDetail } from '@/features/listings/types';
import { toApiError } from '@/shared/api/apiError';
import { addFavorite, getMyFavorites, removeFavorite } from '../api/favoritesApi';

/** `page` is one-based, as in the URL. */
export function useMyFavorites(page: number) {
  return useQuery({
    queryKey: favoriteKeys.list(page),
    queryFn: () => getMyFavorites({ page: page - 1, size: LISTINGS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

interface ToggleFavoriteVariables {
  listingId: number;
  favorite: boolean;
}

/** Flips the favorite on the detail page immediately and rolls back if the request fails. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, favorite }: ToggleFavoriteVariables) =>
      favorite ? addFavorite(listingId) : removeFavorite(listingId),
    onMutate: async ({ listingId, favorite }) => {
      const detailKey = listingKeys.detail(listingId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previousListing = queryClient.getQueryData<ListingDetail>(detailKey);
      if (previousListing && previousListing.favoritedByMe !== favorite) {
        queryClient.setQueryData<ListingDetail>(detailKey, {
          ...previousListing,
          favoritedByMe: favorite,
          favoriteCount: Math.max(0, previousListing.favoriteCount + (favorite ? 1 : -1)),
        });
      }
      return { previousListing };
    },
    onError: (error, { listingId }, context) => {
      if (context?.previousListing) {
        queryClient.setQueryData(listingKeys.detail(listingId), context.previousListing);
      }
      toast.error(`Favori güncellenemedi: ${toApiError(error).message}`);
    },
    onSettled: (_result, _error, { listingId }) =>
      Promise.all([
        // Every GET of a listing counts as a view on the backend, so the open detail page
        // keeps the optimistic count instead of refetching; it is fresh on the next visit
        queryClient.invalidateQueries({
          queryKey: listingKeys.detail(listingId),
          refetchType: 'none',
        }),
        queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
      ]),
  });
}
