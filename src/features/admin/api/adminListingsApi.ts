import type { ListingDetail, ListingSummary } from '@/features/listings/types';
import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import type { AdminListingQuery, ApproveListingRequest, RejectListingRequest } from '../types';

export async function getAdminListings(
  query: AdminListingQuery,
): Promise<PageResponse<ListingSummary>> {
  const response = await http.get<PageResponse<ListingSummary>>('/admin/listings', {
    params: query,
  });
  return response.data;
}

export async function getAdminListing(listingId: number): Promise<ListingDetail> {
  const response = await http.get<ListingDetail>(`/admin/listings/${listingId}`);
  return response.data;
}

export async function approveListing(
  listingId: number,
  request: ApproveListingRequest,
): Promise<ListingDetail> {
  const response = await http.post<ListingDetail>(`/admin/listings/${listingId}/approve`, request);
  return response.data;
}

export async function rejectListing(
  listingId: number,
  request: RejectListingRequest,
): Promise<ListingDetail> {
  const response = await http.post<ListingDetail>(`/admin/listings/${listingId}/reject`, request);
  return response.data;
}
