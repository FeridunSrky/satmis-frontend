import type { AdminCommentQuery, AdminListingQuery, AdminUserQuery, PageRequest } from './types';

export const adminKeys = {
  all: ['admin'] as const,
  listingQueues: () => [...adminKeys.all, 'listings'] as const,
  listingQueue: (query: AdminListingQuery) => [...adminKeys.listingQueues(), query] as const,
  listing: (listingId: number) => [...adminKeys.all, 'listing', listingId] as const,
  userLists: () => [...adminKeys.all, 'users'] as const,
  users: (query: AdminUserQuery) => [...adminKeys.userLists(), query] as const,
  reportQueues: () => [...adminKeys.all, 'reports'] as const,
  reportQueue: (query: PageRequest) => [...adminKeys.reportQueues(), query] as const,
  listingReportsAll: (listingId: number) =>
    [...adminKeys.all, 'listingReports', listingId] as const,
  listingReports: (listingId: number, query: PageRequest) =>
    [...adminKeys.listingReportsAll(listingId), query] as const,
  commentQueues: () => [...adminKeys.all, 'comments'] as const,
  commentQueue: (query: AdminCommentQuery) => [...adminKeys.commentQueues(), query] as const,
  moderationCounts: () => [...adminKeys.all, 'moderationCounts'] as const,
};
