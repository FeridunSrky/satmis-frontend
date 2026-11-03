import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/authStore';
import { EmailVerificationAlert } from '@/features/auth/components/EmailVerificationAlert';
import type { ListingDetail } from '@/features/listings/types';
import { Notice } from '@/shared/components/Notice';
import { buildLoginPath } from '@/shared/lib/safeRedirect';
import { COMMENT_FORM_COPY } from '../commentCopy';
import { commentSendErrorHandler } from '../commentErrorHandlers';
import { useCreateComment } from '../hooks/useCommentMutations';
import { COMMENT_VERIFY_MESSAGE, CommentForm } from './CommentForm';
import { CommentQuotaGate } from './CommentQuotaGate';

interface CommentWriterProps {
  listing: Pick<ListingDetail, 'id' | 'status' | 'seller'>;
}

const linkClassName = 'font-semibold text-brand-700 hover:underline';

/** Decides who may write here and shows the comment form, or why it is not offered. */
export function CommentWriter({ listing }: CommentWriterProps) {
  const user = useAuthStore((state) => (state.status === 'authenticated' ? state.user : null));

  // A sold or unpublished listing takes no new comments; the published ones stay readable
  if (listing.status !== 'ACTIVE') {
    return null;
  }
  if (!user) {
    return (
      <p className="text-sm">
        <Link to={buildLoginPath(`/ilan/${listing.id}`)} className={linkClassName}>
          Yorum yazmak için giriş yapın
        </Link>
      </p>
    );
  }
  if (user.id === listing.seller.id) {
    return <p className="text-sm text-muted">Gelen yorumlara cevap verebilirsiniz.</p>;
  }
  if (user.emailVerified === false) {
    return <EmailVerificationAlert message={COMMENT_VERIFY_MESSAGE} />;
  }
  return <SignedInCommentWriter listingId={listing.id} />;
}

function SignedInCommentWriter({ listingId }: { listingId: number }) {
  const createComment = useCreateComment(listingId);
  const [hasSent, setHasSent] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string>();

  const handleSent = () => {
    setHasSent(true);
    toast.success('Yorumunuz incelemeye gönderildi');
  };

  return (
    <div className="flex flex-col gap-4">
      {hasSent && (
        <Notice title="Yorumunuz incelemeye gönderildi">
          Onaylanınca burada görünecek. Durumunu{' '}
          <Link to="/yorumlarim" className={linkClassName}>
            Yorumlarım
          </Link>{' '}
          sayfasından takip edebilirsiniz.
        </Notice>
      )}
      {limitMessage ? (
        <Notice tone="danger" title={limitMessage} />
      ) : (
        <CommentQuotaGate listingId={listingId}>
          <CommentForm
            copy={COMMENT_FORM_COPY}
            send={(request) => createComment.mutateAsync(request)}
            onSendError={commentSendErrorHandler(setLimitMessage)}
            onSent={handleSent}
          />
        </CommentQuotaGate>
      )}
    </div>
  );
}
