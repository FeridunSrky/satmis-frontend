import { formatDateTime } from '@/shared/lib/format';
import type { CommentReply, ListingComment } from '../types';
import { CommentAttachmentList } from './CommentAttachmentList';
import { ReplyComposer } from './ReplyComposer';

interface CommentItemProps {
  comment: ListingComment;
  listingId: number;
  /** False on read-only views such as the sold vehicles page. */
  allowReplies: boolean;
  onOutdated: () => void;
}

export function CommentItem({ comment, listingId, allowReplies, onOutdated }: CommentItemProps) {
  return (
    <article className="rounded-2xl border border-line bg-paper p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{comment.authorName}</p>
        <CommentDate isoTimestamp={comment.createdAt} />
      </header>
      <p className="mt-2 whitespace-pre-line text-ink/90">{comment.body}</p>
      <CommentAttachmentList attachments={comment.attachments} />
      {comment.reply && <OwnerReply reply={comment.reply} />}
      {allowReplies && comment.canReply && (
        <ReplyComposer listingId={listingId} commentId={comment.id} onOutdated={onOutdated} />
      )}
    </article>
  );
}

function OwnerReply({ reply }: { reply: CommentReply }) {
  return (
    <section
      aria-label="İlan sahibinin cevabı"
      className="mt-4 ml-4 border-l-4 border-brand-600 pl-4 sm:ml-8"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-brand-700">İlan sahibi</p>
        <CommentDate isoTimestamp={reply.createdAt} />
      </header>
      <p className="mt-1 whitespace-pre-line text-ink/90">{reply.body}</p>
      <CommentAttachmentList attachments={reply.attachments} altPrefix="Cevap eki" />
    </section>
  );
}

export function CommentDate({ isoTimestamp }: { isoTimestamp: string }) {
  return (
    <time dateTime={isoTimestamp} className="text-sm text-muted">
      {formatDateTime(isoTimestamp)}
    </time>
  );
}
