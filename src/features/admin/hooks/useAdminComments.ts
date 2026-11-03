import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentKeys } from '@/features/comments/commentKeys';
import {
  approveComment,
  getAdminComments,
  getModerationCounts,
  rejectComment,
} from '../api/adminCommentsApi';
import { adminKeys } from '../adminKeys';
import type { AdminComment, AdminCommentQuery } from '../types';

export const COMMENT_QUEUE_PAGE_SIZE = 20;
const COUNTS_REFRESH_MS = 60_000;

export function useCommentQueue(query: AdminCommentQuery) {
  return useQuery({
    queryKey: adminKeys.commentQueue(query),
    queryFn: () => getAdminComments(query),
    placeholderData: keepPreviousData,
  });
}

/** Tab badges; polled while an admin page is open, since other admins work the same queues. */
export function useModerationCounts() {
  return useQuery({
    queryKey: adminKeys.moderationCounts(),
    queryFn: getModerationCounts,
    refetchInterval: COUNTS_REFRESH_MS,
  });
}

// A decision changes the queue, the badges and what the listing page shows
function useInvalidateAfterCommentDecision() {
  const queryClient = useQueryClient();
  return (comment: AdminComment) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.commentQueues() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.moderationCounts() }),
      queryClient.invalidateQueries({ queryKey: commentKeys.listing(comment.listingId) }),
    ]);
}

export function useApproveComment() {
  const invalidate = useInvalidateAfterCommentDecision();
  return useMutation({
    mutationFn: ({ commentId, version }: { commentId: number; version: number }) =>
      approveComment(commentId, { version }),
    onSuccess: invalidate,
  });
}

export function useRejectComment() {
  const invalidate = useInvalidateAfterCommentDecision();
  return useMutation({
    mutationFn: ({
      commentId,
      ...request
    }: {
      commentId: number;
      version: number;
      reason: string;
    }) => rejectComment(commentId, request),
    onSuccess: invalidate,
  });
}
