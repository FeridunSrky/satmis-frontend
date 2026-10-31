import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/components/Button';
import { FormDialog } from '@/shared/components/FormDialog';
import { TextAreaField } from '@/shared/components/TextAreaField';

const MAX_REASON_LENGTH = 500;

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Gerekçe zorunludur')
    .max(MAX_REASON_LENGTH, `Gerekçe en fazla ${MAX_REASON_LENGTH} karakter olabilir`),
});

interface RejectDialogProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  onCancel: () => void;
  /** Resolves with a field error to show under the reason, or nothing when it is handled. */
  onSubmit: (reason: string) => Promise<string | undefined>;
}

export function RejectDialog({
  isOpen,
  title,
  submitLabel,
  onCancel,
  onSubmit,
}: RejectDialogProps) {
  return (
    <FormDialog
      isOpen={isOpen}
      title={title}
      description="Gerekçe ilan sahibine aynen gösterilir."
      onClose={onCancel}
    >
      <RejectForm submitLabel={submitLabel} onCancel={onCancel} onSubmit={onSubmit} />
    </FormDialog>
  );
}

// Mounted only while the dialog is open, so every opening starts with an empty form
function RejectForm({
  submitLabel,
  onCancel,
  onSubmit,
}: Omit<RejectDialogProps, 'isOpen' | 'title'>) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });

  const submit = handleSubmit(async ({ reason }) => {
    const fieldError = await onSubmit(reason);
    if (fieldError) {
      setError('reason', { type: 'server', message: fieldError }, { shouldFocus: true });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <TextAreaField
        label="Gerekçe"
        maxLength={MAX_REASON_LENGTH}
        error={errors.reason?.message}
        {...register('reason')}
      />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit" variant="danger" disabled={isSubmitting}>
          {isSubmitting ? 'Gönderiliyor...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
