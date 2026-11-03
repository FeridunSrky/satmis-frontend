import { useFileUploads } from '@/features/listings/hooks/useFileUploads';
import { ATTACHMENT_TARGET } from '../attachments/attachmentTarget';

/** Evidence files of a comment being written, uploaded as soon as they are picked. */
export function useCommentAttachments() {
  return useFileUploads(ATTACHMENT_TARGET);
}

export type CommentAttachmentsState = ReturnType<typeof useCommentAttachments>;
