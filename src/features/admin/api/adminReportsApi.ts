import type { ListingDetail } from '@/features/listings/types';
import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import type {
  AdminListingReport,
  PageRequest,
  RejectListingRequest,
  ReportedListing,
} from '../types';

export async function getReportedListings(
  query: PageRequest,
): Promise<PageResponse<ReportedListing>> {
  const response = await http.get<PageResponse<ReportedListing>>('/admin/reports', {
    params: query,
  });
  return response.data;
}

export async function getListingReports(
  listingId: number,
  query: PageRequest,
): Promise<PageResponse<AdminListingReport>> {
  const response = await http.get<PageResponse<AdminListingReport>>(
    `/admin/reports/listings/${listingId}`,
    { params: query },
  );
  return response.data;
}

export async function dismissReports(listingId: number): Promise<void> {
  await http.post(`/admin/reports/listings/${listingId}/dismiss`);
}

/** Same body and rules as rejecting a listing; also closes its open reports. */
export async function takeDownListing(
  listingId: number,
  request: RejectListingRequest,
): Promise<ListingDetail> {
  const response = await http.post<ListingDetail>(
    `/admin/reports/listings/${listingId}/take-down`,
    request,
  );
  return response.data;
}
