import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateListingLists } from '@/features/listings/listingKeys';
import { blockUser, getAdminUsers, unblockUser } from '../api/adminUsersApi';
import { adminKeys } from '../adminKeys';

export const ADMIN_USERS_PAGE_SIZE = 20;

/** `page` is one-based, as in the URL. */
export function useAdminUsers(searchText: string | undefined, page: number) {
  const query = { q: searchText, page: page - 1, size: ADMIN_USERS_PAGE_SIZE };
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => getAdminUsers(query),
    placeholderData: keepPreviousData,
  });
}

// Blocking hides the user's listings everywhere, so public lists are refreshed as well
function useUserStatusMutation(change: (userId: number) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: change,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.userLists() }),
        invalidateListingLists(queryClient),
      ]),
  });
}

export const useBlockUser = () => useUserStatusMutation(blockUser);
export const useUnblockUser = () => useUserStatusMutation(unblockUser);
