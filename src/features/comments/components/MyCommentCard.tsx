import { Link } from 'react-router-dom';
import type { MyComment } from '../types';
import { CommentDate } from './CommentItem';
import { CommentStatusBadge } from './CommentStatusBadge';
import { DeleteCommentButton } from './DeleteCommentButton';
import { ExpandableText } from './ExpandableText';

export function MyCommentCard({ comment }: { comment: MyComment }) {
  const kind = comment.parentId === null ? 'Yorum' : 'Cevap';

  return (
    <article className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/ilan/${comment.listingId}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          {comment.listingTitle}
        </Link>
        <CommentStatusBadge status={comment.status} />
      </header>
      <p className="flex flex-wrap gap-x-3 text-sm text-muted">
        <span className="font-semibold text-ink">{kind}</span>
        <CommentDate isoTimestamp={comment.createdAt} />
        <span>{comment.attachments.length} ek</span>
      </p>
      {comment.status === 'REJECTED' && comment.rejectionReason && (
        <p className="rounded-md border-l-4 border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Red nedeni: {comment.rejectionReason}
        </p>
      )}
      <ExpandableText text={comment.body} />
      <div className="mt-auto flex justify-end">
        <DeleteCommentButton comment={comment} />
      </div>
    </article>
  );
}
