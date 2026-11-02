import { useMutation } from '@tanstack/react-query';
import { reportListing } from '../api/listingReportsApi';
import type { CreateReportRequest } from '../types';

// Nothing the reporter sees changes, so no cache needs refreshing
export function useReportListing(listingId: number) {
  return useMutation({
    mutationFn: (request: CreateReportRequest) => reportListing(listingId, request),
  });
}
