import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
  /** Who reads the reason; listing decisions show it to the owner. */
  description?: string;
  /** Shows how many characters are left under the field. */
  showRemaining?: boolean;
  submitLabel: string;
  onCancel: () => void;
  /** Resolves with a field error to show under the reason, or nothing when it is handled. */
  onSubmit: (reason: string) => Promise<string | undefined>;
}

export function RejectDialog({
  isOpen,
  title,
  description = 'Gerekçe ilan sahibine aynen gösterilir.',
  showRemaining = false,
  submitLabel,
  onCancel,
  onSubmit,
}: RejectDialogProps) {
  return (
    <FormDialog isOpen={isOpen} title={title} description={description} onClose={onCancel}>
      <RejectForm
        submitLabel={submitLabel}
        showRemaining={showRemaining}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </FormDialog>
  );
}

// Mounted only while the dialog is open, so every opening starts with an empty form
function RejectForm({
  submitLabel,
  showRemaining,
  onCancel,
  onSubmit,
}: Omit<RejectDialogProps, 'isOpen' | 'title' | 'description'>) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });
  const remaining = MAX_REASON_LENGTH - useWatch({ control, name: 'reason' }).length;

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
        hint={showRemaining ? `${remaining} karakter kaldı` : undefined}
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
