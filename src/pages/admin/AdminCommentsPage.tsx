import { Navigate, useSearchParams } from 'react-router-dom';
import { HTTP_FORBIDDEN } from '@/features/admin/adminErrors';
import {
  COMMENT_FILTER_LABELS,
  COMMENT_QUEUE_PATH,
  DEFAULT_COMMENT_STATUS,
  parseCommentQueueFilter,
  toCommentQueueParams,
} from '@/features/admin/commentQueueParams';
import { CommentQueueFilters } from '@/features/admin/components/CommentQueueFilters';
import { CommentQueueList } from '@/features/admin/components/CommentQueueList';
import { COMMENT_QUEUE_PAGE_SIZE, useCommentQueue } from '@/features/admin/hooks/useAdminComments';
import { parsePageParam } from '@/features/listings/searchParams';
import { hasStatus } from '@/shared/api/apiError';
import type { CommentStatus } from '@/shared/api/enums';

export function AdminCommentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseCommentQueueFilter(searchParams);
  const page = parsePageParam(searchParams);
  const queueQuery = useCommentQueue({
    status: filter.status,
    ...(filter.listingId !== null && { listingId: filter.listingId }),
    page: page - 1,
    size: COMMENT_QUEUE_PAGE_SIZE,
  });

  if (hasStatus(queueQuery.error, HTTP_FORBIDDEN)) {
    return <Navigate to="/" replace />;
  }

  return (
    <section aria-labelledby="admin-comments-title">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="admin-comments-title" className="font-display text-3xl font-bold">
          Yorumlar
        </h2>
        <CommentQueueFilters
          filter={filter}
          onChange={(next) => setSearchParams(toCommentQueueParams(next))}
        />
      </div>
      <CommentQueueList
        query={queueQuery}
        page={page}
        basePath={COMMENT_QUEUE_PATH}
        searchParams={searchParams}
        emptyTitle={emptyTitle(filter.status)}
      />
    </section>
  );
}

function emptyTitle(status: CommentStatus): string {
  return status === DEFAULT_COMMENT_STATUS
    ? 'Onay bekleyen yorum yok.'
    : `“${COMMENT_FILTER_LABELS[status]}” durumunda yorum yok.`;
}
