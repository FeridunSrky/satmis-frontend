import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import type { CommentQuota, CommentRequest, ListingComment, MyComment } from '../types';

interface PageRequest {
  page: number;
  size: number;
}

export async function getListingComments(
  listingId: number,
  query: PageRequest,
): Promise<PageResponse<ListingComment>> {
  const response = await http.get<PageResponse<ListingComment>>(
    `/listings/${listingId}/comments`,
    { params: query },
  );
  return response.data;
}

export async function createComment(
  listingId: number,
  request: CommentRequest,
): Promise<MyComment> {
  const response = await http.post<MyComment>(`/listings/${listingId}/comments`, request);
  return response.data;
}

export async function replyToComment(
  commentId: number,
  request: CommentRequest,
): Promise<MyComment> {
  const response = await http.post<MyComment>(`/comments/${commentId}/reply`, request);
  return response.data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await http.delete(`/comments/${commentId}`);
}

export async function getMyComments(query: PageRequest): Promise<PageResponse<MyComment>> {
  const response = await http.get<PageResponse<MyComment>>('/users/me/comments', {
    params: query,
  });
  return response.data;
}

export async function getCommentQuota(listingId: number): Promise<CommentQuota> {
  const response = await http.get<CommentQuota>('/users/me/comments/quota', {
    params: { listingId },
  });
  return response.data;
}
