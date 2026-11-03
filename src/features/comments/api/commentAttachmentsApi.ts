import type { ImageUpload } from '@/features/listings/types';
import { http } from '@/shared/api/http';
import type { AttachmentUploadRequest, CommentAttachment } from '../types';

// Same flow as listing images: the file goes straight to storage, these calls only manage it

export async function requestAttachmentUpload(
  request: AttachmentUploadRequest,
): Promise<ImageUpload> {
  const response = await http.post<ImageUpload>('/comment-attachments', request);
  return response.data;
}

export async function completeAttachmentUpload(attachmentId: number): Promise<CommentAttachment> {
  const response = await http.post<CommentAttachment>(
    `/comment-attachments/${attachmentId}/complete`,
  );
  return response.data;
}

export async function deleteAttachmentUpload(attachmentId: number): Promise<void> {
  await http.delete(`/comment-attachments/${attachmentId}`);
}
