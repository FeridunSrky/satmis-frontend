import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/Button';
import { REPLY_FORM_COPY } from '../commentCopy';
import { replySendErrorHandler } from '../commentErrorHandlers';
import { useReplyToComment } from '../hooks/useCommentMutations';
import { CommentForm } from './CommentForm';

interface ReplyComposerProps {
  listingId: number;
  commentId: number;
  /** Reloads the comments when an answer shows they are outdated. */
  onOutdated: () => void;
}

/** The owner's "Cevap yaz": the comment form with reply wording, opened on demand. */
export function ReplyComposer({ listingId, commentId, onOutdated }: ReplyComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reply = useReplyToComment(listingId);

  if (!isOpen) {
    return (
      <Button variant="secondary" className="mt-3" onClick={() => setIsOpen(true)}>
        Cevap yaz
      </Button>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-sm text-muted">
        Her yoruma bir cevap hakkınız var. Cevabınız incelendikten sonra yayınlanır.
      </p>
      <CommentForm
        copy={REPLY_FORM_COPY}
        send={(request) => reply.mutateAsync({ commentId, request })}
        onSendError={replySendErrorHandler(onOutdated)}
        onSent={() => {
          setIsOpen(false);
          toast.success('Cevabınız incelemeye gönderildi');
        }}
        onCancel={() => setIsOpen(false)}
      />
    </div>
  );
}
