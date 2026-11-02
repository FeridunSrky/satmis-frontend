import { http } from '@/shared/api/http';
import type { CreateReportRequest, ListingReport } from '../types';

export async function reportListing(
  listingId: number,
  request: CreateReportRequest,
): Promise<ListingReport> {
  const response = await http.post<ListingReport>(`/listings/${listingId}/reports`, request);
  return response.data;
}
