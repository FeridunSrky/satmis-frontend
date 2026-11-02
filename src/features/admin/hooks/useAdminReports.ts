import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LISTINGS_PAGE_SIZE } from '@/features/listings/searchParams';
import {
  dismissReports,
  getListingReports,
  getReportedListings,
  takeDownListing,
} from '../api/adminReportsApi';
import { adminKeys } from '../adminKeys';
import type { ReportedListing } from '../types';
import { useInvalidateAfterReview } from './useAdminListings';

export const LISTING_REPORTS_PAGE_SIZE = 20;

/** A queue entry keyed by its listing, so it fits the shared listing grid. */
export type ReportQueueItem = ReportedListing & { id: number };

/** `page` is one-based, as in the URL. */
export function useReportQueue(page: number) {
  const query = { page: page - 1, size: LISTINGS_PAGE_SIZE };
  return useQuery({
    queryKey: adminKeys.reportQueue(query),
    queryFn: () => getReportedListings(query),
    select: (result) => ({
      ...result,
      content: result.content.map((entry): ReportQueueItem => ({ ...entry, id: entry.listing.id })),
    }),
    placeholderData: keepPreviousData,
  });
}

/** `page` is one-based, as in the URL. */
export function useListingReports(listingId: number | null, page: number) {
  const query = { page: page - 1, size: LISTING_REPORTS_PAGE_SIZE };
  return useQuery({
    queryKey: adminKeys.listingReports(listingId ?? 0, query),
    queryFn: () => getListingReports(listingId ?? 0, query),
    enabled: listingId !== null,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateReports() {
  const queryClient = useQueryClient();
  return (listingId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.reportQueues() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.listingReportsAll(listingId) }),
    ]);
}

// Dismissing leaves the listing untouched, so only the report views change
export function useDismissReports() {
  const invalidateReports = useInvalidateReports();
  return useMutation({
    mutationFn: dismissReports,
    onSuccess: (_result, listingId) => invalidateReports(listingId),
  });
}

// Taking down rejects the listing, so the approval views and public lists change too
export function useTakeDownListing() {
  const invalidateReports = useInvalidateReports();
  const invalidateReview = useInvalidateAfterReview();
  return useMutation({
    mutationFn: ({
      listingId,
      ...request
    }: {
      listingId: number;
      version: number;
      reason: string;
    }) => takeDownListing(listingId, request),
    onSuccess: (listing) =>
      Promise.all([invalidateReports(listing.id), invalidateReview(listing.id)]),
  });
}
