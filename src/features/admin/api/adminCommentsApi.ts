import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import type {
  AdminComment,
  AdminCommentQuery,
  ApproveListingRequest,
  ModerationCounts,
  RejectListingRequest,
} from '../types';

export async function getAdminComments(
  query: AdminCommentQuery,
): Promise<PageResponse<AdminComment>> {
  const response = await http.get<PageResponse<AdminComment>>('/admin/comments', {
    params: query,
  });
  return response.data;
}

// Decisions carry the reviewed version, like listing decisions, so the bodies are shared
export async function approveComment(
  commentId: number,
  request: ApproveListingRequest,
): Promise<AdminComment> {
  const response = await http.post<AdminComment>(`/admin/comments/${commentId}/approve`, request);
  return response.data;
}

export async function rejectComment(
  commentId: number,
  request: RejectListingRequest,
): Promise<AdminComment> {
  const response = await http.post<AdminComment>(`/admin/comments/${commentId}/reject`, request);
  return response.data;
}

export async function getModerationCounts(): Promise<ModerationCounts> {
  const response = await http.get<ModerationCounts>('/admin/moderation/counts');
  return response.data;
}
