import { useState } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog, type ConfirmCopy } from '@/shared/components/ConfirmDialog';
import { useDeleteComment } from '../hooks/useCommentMutations';
import type { MyComment } from '../types';

const DELETE_CONFIRM: ConfirmCopy = {
  title: 'Yorum silinsin mi?',
  description:
    'Yorum silinecek. Yorum hakkınız geri gelmez. Yorumun altındaki cevap da silinir.',
  confirmLabel: 'Sil',
  tone: 'danger',
};

export function DeleteCommentButton({ comment }: { comment: Pick<MyComment, 'id' | 'listingId'> }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const deleteComment = useDeleteComment();

  const handleConfirm = async () => {
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, listingId: comment.listingId });
      toast.success('Yorum silindi');
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <Button
        variant="danger"
        disabled={deleteComment.isPending}
        onClick={() => setIsConfirming(true)}
      >
        Sil
      </Button>
      <ConfirmDialog
        isOpen={isConfirming}
        {...DELETE_CONFIRM}
        isConfirming={deleteComment.isPending}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
