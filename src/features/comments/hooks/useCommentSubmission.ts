import { useState } from 'react';
import type { UseFormReset, UseFormSetError } from 'react-hook-form';
import { toApiError } from '@/shared/api/apiError';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { SERVER_ERROR_KEY } from '@/shared/lib/formServerErrors';
import { toCommentSendProblem } from '../commentSendErrors';
import type { CommentRequest } from '../types';
import type { CommentAttachmentsState } from './useCommentAttachments';

/** A caller-specific reading of a failed send: a message for the form, or handled elsewhere. */
export type SendErrorOutcome = { message: string } | 'handled' | undefined;

interface CommentFormValues {
  body: string;
}

interface CommentSubmissionOptions {
  send: (request: CommentRequest) => Promise<unknown>;
  onSendError?: (error: unknown) => SendErrorOutcome;
  onSent: () => void;
  attachments: CommentAttachmentsState;
  setError: UseFormSetError<CommentFormValues>;
  reset: UseFormReset<CommentFormValues>;
}

/** Holds the validated request until it is confirmed, sends it and explains a failure. */
export function useCommentSubmission(options: CommentSubmissionOptions) {
  const { send, onSendError, onSent, attachments, setError, reset } = options;
  const [pendingRequest, setPendingRequest] = useState<CommentRequest | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const { isCoolingDown, startCooldown } = useRetryCooldown();

  const showError = (error: unknown) => {
    startCooldown(toApiError(error));
    const outcome = onSendError?.(error);
    if (outcome === 'handled') {
      return;
    }
    if (outcome) {
      setError(SERVER_ERROR_KEY, { message: outcome.message });
      return;
    }
    const problem = toCommentSendProblem(error);
    if (problem.clearAttachments) {
      attachments.clear({ discard: true });
    }
    setNeedsEmailVerification(problem.needsEmailVerification === true);
    if (problem.bodyError) {
      setError('body', { type: 'server', message: problem.bodyError }, { shouldFocus: true });
    } else if (problem.message) {
      setError(SERVER_ERROR_KEY, { message: problem.message });
    }
  };

  const confirm = async () => {
    if (!pendingRequest) {
      return;
    }
    setIsSending(true);
    try {
      await send(pendingRequest);
      reset();
      // The files now belong to the sent comment, so they are only dropped from the form
      attachments.clear({ discard: false });
      onSent();
    } catch (error) {
      showError(error);
    } finally {
      setIsSending(false);
      setPendingRequest(null);
    }
  };

  return {
    pendingRequest,
    request: (body: string) =>
      setPendingRequest({
        body,
        ...(attachments.imageIds.length > 0 && { attachmentIds: attachments.imageIds }),
      }),
    cancel: () => setPendingRequest(null),
    confirm,
    isSending,
    isCoolingDown,
    needsEmailVerification,
  };
}
