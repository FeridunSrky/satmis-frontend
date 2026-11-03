import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { EmailVerificationAlert } from '@/features/auth/components/EmailVerificationAlert';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog, type ConfirmCopy } from '@/shared/components/ConfirmDialog';
import { FormAlert } from '@/shared/components/FormAlert';
import { TextAreaField } from '@/shared/components/TextAreaField';
import { AttachmentsField } from '../attachments/AttachmentsField';
import { COMMENT_MAX_LENGTH, COMMENT_MIN_LENGTH, commentSchema } from '../commentSchema';
import { useCommentAttachments } from '../hooks/useCommentAttachments';
import { useCommentSubmission, type SendErrorOutcome } from '../hooks/useCommentSubmission';
import type { CommentRequest } from '../types';

export const COMMENT_VERIFY_MESSAGE =
  'Yorum yazmak için e-posta adresini doğrula. Linki bulamıyorsan yenisini gönderebiliriz.';

/** Wording that differs between a comment and the owner's reply. */
export interface CommentFormCopy {
  label: string;
  submitLabel: string;
  confirm: ConfirmCopy;
}

interface CommentFormProps {
  copy: CommentFormCopy;
  send: (request: CommentRequest) => Promise<unknown>;
  /** Caller-specific errors, read before the ones every comment can get. */
  onSendError?: (error: unknown) => SendErrorOutcome;
  onSent: () => void;
  onCancel?: () => void;
}

/** Text plus evidence files; used for comments and, with other wording, for replies. */
export function CommentForm({ copy, send, onSendError, onSent, onCancel }: CommentFormProps) {
  const attachments = useCommentAttachments();
  const blockedReasonId = useId();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const submission = useCommentSubmission({
    send,
    onSendError,
    onSent,
    attachments,
    setError,
    reset,
  });
  const remaining = COMMENT_MAX_LENGTH - useWatch({ control, name: 'body' }).length;
  const blockedReason = describeSubmitBlock(attachments);

  // Validation only opens the confirmation; nothing is sent before the user agrees
  const submit = handleSubmit(({ body }) => submission.request(body));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {submission.needsEmailVerification && (
        <EmailVerificationAlert message={COMMENT_VERIFY_MESSAGE} />
      )}
      <FormAlert message={errors.root?.server?.message} />
      <TextAreaField
        label={copy.label}
        maxLength={COMMENT_MAX_LENGTH}
        hint={`${remaining} karakter kaldı. En az ${COMMENT_MIN_LENGTH} karakter.`}
        error={errors.body?.message}
        {...register('body')}
      />
      <AttachmentsField attachments={attachments} />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {blockedReason && (
          <p id={blockedReasonId} className="mr-auto text-sm text-muted">
            {blockedReason}
          </p>
        )}
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Vazgeç
          </Button>
        )}
        <Button
          type="submit"
          disabled={submission.isSending || submission.isCoolingDown || blockedReason !== undefined}
          aria-describedby={blockedReason ? blockedReasonId : undefined}
        >
          {submission.isSending ? 'Gönderiliyor...' : copy.submitLabel}
        </Button>
      </div>
      <ConfirmDialog
        isOpen={submission.pendingRequest !== null}
        {...copy.confirm}
        isConfirming={submission.isSending}
        onConfirm={() => void submission.confirm()}
        onCancel={submission.cancel}
      />
    </form>
  );
}

function describeSubmitBlock({
  isUploading,
  hasFailedImages,
}: ReturnType<typeof useCommentAttachments>): string | undefined {
  if (isUploading) {
    return 'Dosyalar yükleniyor; bitince gönderebilirsiniz.';
  }
  if (hasFailedImages) {
    return 'Yüklenemeyen dosyaları kaldırın veya tekrar deneyin.';
  }
  return undefined;
}
