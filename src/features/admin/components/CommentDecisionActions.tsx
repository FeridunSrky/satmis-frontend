import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { APPROVE_COMMENT_CONFIRM } from '../confirmations';
import { useApproveComment, useRejectComment } from '../hooks/useAdminComments';
import { useCommentDecisionErrors } from '../hooks/useCommentDecisionErrors';
import { reasonFieldError } from '../hooks/useDecisionErrors';
import type { AdminComment } from '../types';
import { RejectDialog } from './RejectDialog';

interface CommentDecisionActionsProps {
  comment: Pick<AdminComment, 'id' | 'version' | 'status'>;
  /** Reloads the queue when an answer shows it is outdated. */
  onReload: () => void;
}

export function CommentDecisionActions({ comment, onReload }: CommentDecisionActionsProps) {
  const [openDialog, setOpenDialog] = useState<'approve' | 'reject'>();
  const approve = useApproveComment();
  const reject = useRejectComment();
  const handleDecisionError = useCommentDecisionErrors(onReload);
  const isApproved = comment.status === 'APPROVED';
  const decision = { commentId: comment.id, version: comment.version };

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(decision);
      toast.success('Yorum onaylandı');
    } catch (error) {
      handleDecisionError(error);
    } finally {
      setOpenDialog(undefined);
    }
  };

  const handleReject = async (reason: string): Promise<string | undefined> => {
    try {
      await reject.mutateAsync({ ...decision, reason });
      setOpenDialog(undefined);
      toast.success(isApproved ? 'Yorum yayından kaldırıldı' : 'Yorum reddedildi');
      return undefined;
    } catch (error) {
      const fieldError = reasonFieldError(error);
      if (fieldError) {
        return fieldError;
      }
      setOpenDialog(undefined);
      handleDecisionError(error);
      return undefined;
    }
  };

  if (comment.status === 'REJECTED') {
    return null;
  }
  const isBusy = approve.isPending || reject.isPending;
  const rejectLabel = isApproved ? 'Yayından kaldır' : 'Reddet';
  return (
    <div className="flex flex-wrap gap-3">
      {!isApproved && (
        <Button disabled={isBusy} onClick={() => setOpenDialog('approve')}>
          Onayla
        </Button>
      )}
      <Button variant="danger" disabled={isBusy} onClick={() => setOpenDialog('reject')}>
        {rejectLabel}
      </Button>
      <ConfirmDialog
        isOpen={openDialog === 'approve'}
        {...APPROVE_COMMENT_CONFIRM}
        isConfirming={approve.isPending}
        onConfirm={() => void handleApprove()}
        onCancel={() => setOpenDialog(undefined)}
      />
      <RejectDialog
        isOpen={openDialog === 'reject'}
        title={isApproved ? 'Yorumu yayından kaldır' : 'Yorumu reddet'}
        description="Yazar bu nedeni görür."
        showRemaining
        submitLabel={rejectLabel}
        onCancel={() => setOpenDialog(undefined)}
        onSubmit={handleReject}
      />
    </div>
  );
}
