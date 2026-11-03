import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasStatus } from '@/shared/api/apiError';
import { createComment, deleteComment, replyToComment } from '../api/commentsApi';
import { commentKeys, invalidateOwnComments } from '../commentKeys';
import type { CommentRequest } from '../types';

const HTTP_NOT_FOUND = 404;

// A new comment waits for approval, so the public list does not change yet
export function useCreateComment(listingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CommentRequest) => createComment(listingId, request),
    onSuccess: () => invalidateOwnComments(queryClient, listingId),
  });
}

// The public list is refreshed too: its `canReply` turns false once a reply is pending
export function useReplyToComment(listingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, request }: { commentId: number; request: CommentRequest }) =>
      replyToComment(commentId, request),
    onSuccess: () =>
      Promise.all([
        invalidateOwnComments(queryClient, listingId),
        queryClient.invalidateQueries({ queryKey: commentKeys.listing(listingId) }),
      ]),
  });
}

/** Refreshes the public list as well, since the deleted comment may have been published. */
export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: number; listingId: number }) => {
      try {
        await deleteComment(commentId);
      } catch (error) {
        // Already gone, e.g. deleted in another tab or together with its listing
        if (!hasStatus(error, HTTP_NOT_FOUND)) {
          throw error;
        }
      }
    },
    onSuccess: (_result, { listingId }) =>
      Promise.all([
        invalidateOwnComments(queryClient, listingId),
        queryClient.invalidateQueries({ queryKey: commentKeys.listing(listingId) }),
      ]),
  });
}
