import type { ListingSort, ListingStatus } from '@/shared/api/enums';
import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import { normalizeKeyword } from '../keyword';
import type {
  ChangeStatusRequest,
  ListingDetail,
  ListingRequest,
  ListingSearchQuery,
  ListingSummary,
} from '../types';

export interface PageQuery {
  page: number;
  size: number;
  sort?: ListingSort;
}

// Public endpoints also go through `http` so a signed-in user's token is attached:
// owners can then open their passive listings and `favoritedByMe` is filled in
export async function searchListings(
  query: ListingSearchQuery,
): Promise<PageResponse<ListingSummary>> {
  // axios drops undefined params, so a blank keyword is not sent at all
  const params = { ...query, q: normalizeKeyword(query.q) };
  const response = await http.get<PageResponse<ListingSummary>>('/listings', { params });
  return response.data;
}

export async function getListing(listingId: number): Promise<ListingDetail> {
  const response = await http.get<ListingDetail>(`/listings/${listingId}`);
  return response.data;
}

export async function createListing(request: ListingRequest): Promise<ListingDetail> {
  const response = await http.post<ListingDetail>('/listings', request);
  return response.data;
}

export async function updateListing(
  listingId: number,
  request: ListingRequest,
): Promise<ListingDetail> {
  const response = await http.put<ListingDetail>(`/listings/${listingId}`, request);
  return response.data;
}

export async function changeListingStatus(
  listingId: number,
  status: ListingStatus,
): Promise<ListingDetail> {
  const request: ChangeStatusRequest = { status };
  const response = await http.patch<ListingDetail>(`/listings/${listingId}/status`, request);
  return response.data;
}

export async function deleteListing(listingId: number): Promise<void> {
  await http.delete(`/listings/${listingId}`);
}

export async function getMyListings(query: PageQuery): Promise<PageResponse<ListingSummary>> {
  const response = await http.get<PageResponse<ListingSummary>>('/users/me/listings', {
    params: query,
  });
  return response.data;
}
