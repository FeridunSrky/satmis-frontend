import type { QueryClient } from '@tanstack/react-query';

export const commentKeys = {
  all: ['comments'] as const,
  listingAll: () => [...commentKeys.all, 'listing'] as const,
  listing: (listingId: number) => [...commentKeys.listingAll(), listingId] as const,
  mineAll: () => [...commentKeys.all, 'mine'] as const,
  mine: (page: number) => [...commentKeys.mineAll(), page] as const,
  quota: (listingId: number) => [...commentKeys.all, 'quota', listingId] as const,
};

/** What the author sees changes after writing, replying or deleting. */
export async function invalidateOwnComments(
  queryClient: QueryClient,
  listingId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: commentKeys.mineAll() }),
    queryClient.invalidateQueries({ queryKey: commentKeys.quota(listingId) }),
  ]);
}
