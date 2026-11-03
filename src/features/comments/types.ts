import type { CommentStatus } from '@/shared/api/enums';

export type CommentAttachmentType = 'JPEG' | 'PNG' | 'WEBP' | 'PDF';

export interface CommentAttachment {
  id: number;
  type: CommentAttachmentType;
  /** Public address; a PDF is served as a download. */
  url: string;
  sizeBytes: number;
}

/** The owner's approved reply; it has no author name, the UI labels it "İlan sahibi". */
export interface CommentReply {
  id: number;
  body: string;
  attachments: CommentAttachment[];
  /** ISO-8601 UTC. */
  createdAt: string;
}

/** An approved comment as the public listing page shows it. */
export interface ListingComment {
  id: number;
  /** Masked by the backend, e.g. "Ayşe Y.". */
  authorName: string;
  body: string;
  attachments: CommentAttachment[];
  /** ISO-8601 UTC. */
  createdAt: string;
  reply: CommentReply | null;
  /** True only for the listing owner, while a reply may be written to this comment. */
  canReply: boolean;
}

/** One of the signed-in user's own comments or replies, in any state. */
export interface MyComment {
  id: number;
  listingId: number;
  listingTitle: string;
  /** Set when this is a reply to that comment. */
  parentId: number | null;
  body: string;
  status: CommentStatus;
  /** Filled only while `status` is REJECTED. */
  rejectionReason: string | null;
  attachments: CommentAttachment[];
  /** ISO-8601 UTC. */
  createdAt: string;
}

export interface CommentQuota {
  listingId: number;
  maxComments: number;
  usedComments: number;
  remainingComments: number;
}

/** Body of a new comment or reply. */
export interface CommentRequest {
  /** 20–2000 characters after trimming. */
  body: string;
  /** At most 5, in display order; each one completed and not used yet. */
  attachmentIds?: number[];
}

export type AttachmentContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export interface AttachmentUploadRequest {
  contentType: AttachmentContentType;
  /** Exact size of the blob that will be PUT; the storage signature covers it. */
  sizeBytes: number;
}
