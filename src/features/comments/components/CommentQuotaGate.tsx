import type { ReactNode } from 'react';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { Notice } from '@/shared/components/Notice';
import { useCommentQuota } from '../hooks/useCommentQueries';

interface CommentQuotaGateProps {
  listingId: number;
  children: ReactNode;
}

/** Shows the form only while the user may still comment on this listing, and says how often. */
export function CommentQuotaGate({ listingId, children }: CommentQuotaGateProps) {
  const quotaQuery = useCommentQuota(listingId);

  if (quotaQuery.isPending) {
    return <p className="text-sm text-muted">Yorum hakkınız kontrol ediliyor...</p>;
  }
  if (quotaQuery.isError) {
    return (
      <Notice tone="danger" title="Yorum hakkınız öğrenilemedi">
        <p>{toApiError(quotaQuery.error).message}</p>
        <Button variant="secondary" className="mt-2" onClick={() => void quotaQuery.refetch()}>
          Tekrar dene
        </Button>
      </Notice>
    );
  }
  const { remainingComments, maxComments } = quotaQuery.data;
  if (remainingComments <= 0) {
    return (
      <Notice
        tone="danger"
        title={`Bu ilana yorum hakkınız doldu (en fazla ${maxComments})`}
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Kalan yorum hakkınız: {remainingComments}</p>
      {children}
    </div>
  );
}
