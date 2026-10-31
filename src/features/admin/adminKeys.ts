import type { AdminListingQuery, AdminUserQuery } from './types';

export const adminKeys = {
  all: ['admin'] as const,
  listingQueues: () => [...adminKeys.all, 'listings'] as const,
  listingQueue: (query: AdminListingQuery) => [...adminKeys.listingQueues(), query] as const,
  listing: (listingId: number) => [...adminKeys.all, 'listing', listingId] as const,
  userLists: () => [...adminKeys.all, 'users'] as const,
  users: (query: AdminUserQuery) => [...adminKeys.userLists(), query] as const,
};
