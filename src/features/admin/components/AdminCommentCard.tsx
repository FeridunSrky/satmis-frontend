import { Link } from 'react-router-dom';
import { CommentAttachmentList } from '@/features/comments/components/CommentAttachmentList';
import { CommentDate } from '@/features/comments/components/CommentItem';
import { CommentStatusBadge } from '@/features/comments/components/CommentStatusBadge';
import { StatusBadge } from '@/features/listings/components/StatusBadge';
import type { AdminComment } from '../types';
import { CommentDecisionActions } from './CommentDecisionActions';

interface AdminCommentCardProps {
  comment: AdminComment;
  onReload: () => void;
}

/** One comment or reply as the moderator reviews it: full text, every attachment, the author. */
export function AdminCommentCard({ comment, onReload }: AdminCommentCardProps) {
  const isReply = comment.parent !== null;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{isReply ? 'İlan sahibinin cevabı' : 'Yorum'}</p>
        <CommentStatusBadge status={comment.status} />
      </header>
      <p className="flex flex-wrap items-center gap-2">
        <Link
          to={`/admin/ilanlar/${comment.listingId}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          {comment.listingTitle}
        </Link>
        <StatusBadge status={comment.listingStatus} />
      </p>
      <p className="flex flex-wrap gap-x-3 text-sm text-muted">
        <span className="font-semibold text-ink">
          {comment.author.firstName} {comment.author.lastName}
        </span>
        <span className="break-all">{comment.author.email}</span>
        <CommentDate isoTimestamp={comment.createdAt} />
      </p>
      {comment.parent && (
        <section
          aria-label="Cevaplanan yorum"
          className="rounded-md border-l-4 border-line bg-surface px-3 py-2 text-sm"
        >
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            Cevaplanan yorum: {comment.parent.authorName}
            <CommentStatusBadge status={comment.parent.status} />
          </p>
          <p className="mt-1 whitespace-pre-line text-ink/80">{comment.parent.body}</p>
        </section>
      )}
      <p className="whitespace-pre-line text-ink/90">{comment.body}</p>
      <CommentAttachmentList attachments={comment.attachments} />
      {comment.rejectionReason && (
        <p className="text-sm text-danger">Red nedeni: {comment.rejectionReason}</p>
      )}
      <CommentDecisionActions comment={comment} onReload={onReload} />
    </article>
  );
}
