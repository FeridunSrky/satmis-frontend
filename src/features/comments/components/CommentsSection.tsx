import type { ReactNode } from 'react';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/lib/cn';
import { COMMENTS_INTRO } from '../commentCopy';
import { useListingComments } from '../hooks/useCommentQueries';
import { CommentItem } from './CommentItem';

const HTTP_NOT_FOUND = 404;

interface CommentsSectionProps {
  listingId: number;
  /** The comment form or why it is not offered; left out on read-only views. */
  writer?: ReactNode;
  allowReplies?: boolean;
  className?: string;
}

export function CommentsSection({
  listingId,
  writer,
  allowReplies = false,
  className,
}: CommentsSectionProps) {
  const commentsQuery = useListingComments(listingId);
  const total = commentsQuery.data?.pages[0]?.totalElements;

  return (
    <section aria-labelledby="comments-title" className={cn('flex flex-col gap-5', className)}>
      <div>
        <h2 id="comments-title" className="font-display text-2xl font-bold">
          {total === undefined ? 'Yorumlar' : `Yorumlar (${total})`}
        </h2>
        <p className="mt-2 text-sm text-muted">{COMMENTS_INTRO}</p>
      </div>
      {writer}
      <CommentListBody query={commentsQuery} listingId={listingId} allowReplies={allowReplies} />
    </section>
  );
}

interface CommentListBodyProps {
  query: ReturnType<typeof useListingComments>;
  listingId: number;
  allowReplies: boolean;
}

function CommentListBody({ query, listingId, allowReplies }: CommentListBodyProps) {
  if (query.isPending) {
    return <p className="text-sm text-muted">Yorumlar yükleniyor...</p>;
  }
  // The listing is not public (e.g. waiting for approval), so it cannot have public comments
  if (query.isError && hasStatus(query.error, HTTP_NOT_FOUND)) {
    return <p className="text-muted">Henüz yorum yok.</p>;
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
        <p className="text-danger">Yorumlar yüklenemedi: {toApiError(query.error).message}</p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Tekrar dene
        </Button>
      </div>
    );
  }
  const comments = query.data.pages.flatMap((page) => page.content);
  if (comments.length === 0) {
    return <p className="text-muted">Henüz yorum yok.</p>;
  }
  return (
    <>
      <ol className="flex flex-col gap-4">
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommentItem
              comment={comment}
              listingId={listingId}
              allowReplies={allowReplies}
              onOutdated={() => void query.refetch()}
            />
          </li>
        ))}
      </ol>
      {query.hasNextPage && (
        <Button
          variant="secondary"
          className="self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Yükleniyor...' : 'Daha fazla yorum'}
        </Button>
      )}
    </>
  );
}
