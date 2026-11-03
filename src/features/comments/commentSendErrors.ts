import {
  ATTACHMENT_NOT_AVAILABLE_CODE,
  EMAIL_NOT_VERIFIED_CODE,
  toApiError,
} from '@/shared/api/apiError';

const ATTACHMENT_NOT_AVAILABLE_MESSAGE = 'Eklerden biri kullanılamıyor, yeniden yükleyin';

/** What the comment form shows after a failed send that the caller did not handle itself. */
export interface CommentSendProblem {
  message?: string;
  bodyError?: string;
  /** The attachments cannot be used any more; nothing was saved and no quota was used. */
  clearAttachments?: boolean;
  needsEmailVerification?: boolean;
}

/** Errors every comment and reply can get; caller-specific ones are handled before this. */
export function toCommentSendProblem(error: unknown): CommentSendProblem {
  const apiError = toApiError(error);
  if (apiError.kind === 'network') {
    return { message: apiError.message };
  }
  if (apiError.code === ATTACHMENT_NOT_AVAILABLE_CODE) {
    return { message: ATTACHMENT_NOT_AVAILABLE_MESSAGE, clearAttachments: true };
  }
  if (apiError.code === EMAIL_NOT_VERIFIED_CODE) {
    return { needsEmailVerification: true };
  }
  const bodyError = apiError.fieldErrors.body;
  return bodyError ? { bodyError } : { message: apiError.message };
}
