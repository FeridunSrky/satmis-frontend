import { buildPageHref } from '@/features/listings/searchParams';
import { Pagination } from '@/shared/components/Pagination';
import { StateMessage } from '@/shared/components/StateMessage';
import type { useCommentQueue } from '../hooks/useAdminComments';
import { AdminCommentCard } from './AdminCommentCard';
import { AdminQueryError } from './AdminQueryError';

interface CommentQueueListProps {
  query: ReturnType<typeof useCommentQueue>;
  /** One-based, as in the URL. */
  page: number;
  basePath: string;
  searchParams: URLSearchParams;
  emptyTitle: string;
}

export function CommentQueueList({
  query,
  page,
  basePath,
  searchParams,
  emptyTitle,
}: CommentQueueListProps) {
  if (query.isPending) {
    return <p className="text-muted">Yorumlar yükleniyor...</p>;
  }
  if (query.isError) {
    return (
      <AdminQueryError
        error={query.error}
        title="Yorumlar yüklenemedi"
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (query.data.content.length === 0) {
    return <StateMessage title={emptyTitle} />;
  }
  return (
    <div aria-busy={query.isFetching}>
      <p className="mb-4 rounded-md border-l-4 border-lane bg-lane/15 px-4 py-3 text-sm font-medium">
        Eklerde kişisel veri (ad soyad, plaka, şasi no, telefon) varsa yorumu reddedin ve nedenini
        yazın.
      </p>
      <ol className="flex flex-col gap-4">
        {query.data.content.map((comment) => (
          <li key={comment.id}>
            <AdminCommentCard comment={comment} onReload={() => void query.refetch()} />
          </li>
        ))}
      </ol>
      <Pagination
        page={page}
        totalPages={query.data.totalPages}
        hrefForPage={(nextPage) => buildPageHref(basePath, searchParams, nextPage)}
      />
    </div>
  );
}
