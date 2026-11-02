import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { TextAreaField } from '@/shared/components/TextAreaField';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { useReportListing } from '../hooks/useReportListing';
import { MAX_REPORT_DESCRIPTION_LENGTH, reportSchema } from './reportSchema';
import { ReportReasonField } from './ReportReasonField';

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const FORM_FIELDS = ['reason', 'description'] as const;

export type ReportOutcome = { kind: 'reported' } | { kind: 'alreadyReported'; message: string };

interface ReportListingFormProps {
  listingId: number;
  onCancel: () => void;
  onDone: (outcome: ReportOutcome) => void;
}

export function ReportListingForm({ listingId, onCancel, onDone }: ReportListingFormProps) {
  const report = useReportListing(listingId);
  const { isCoolingDown, startCooldown } = useRetryCooldown();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(reportSchema), defaultValues: { description: '' } });
  const remaining =
    MAX_REPORT_DESCRIPTION_LENGTH - useWatch({ control, name: 'description' }).length;

  const submit = handleSubmit(async (request) => {
    try {
      await report.mutateAsync(request);
      onDone({ kind: 'reported' });
    } catch (error) {
      const apiError = toApiError(error);
      // The user's earlier report is still open: not a failure, it is already being reviewed
      if (hasStatus(error, HTTP_CONFLICT)) {
        onDone({ kind: 'alreadyReported', message: apiError.message });
        return;
      }
      if (hasStatus(error, HTTP_NOT_FOUND)) {
        setError('root.server', { message: 'Bu ilan artık yayında değil.' });
        return;
      }
      startCooldown(apiError);
      applyServerErrors(apiError, setError, { formFields: FORM_FIELDS });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      <ReportReasonField registration={register('reason')} error={errors.reason?.message} />
      <TextAreaField
        label="Açıklama"
        maxLength={MAX_REPORT_DESCRIPTION_LENGTH}
        hint={`${remaining} karakter kaldı. "Diğer" seçtiyseniz zorunludur.`}
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={isSubmitting || isCoolingDown}>
          {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
        </Button>
      </div>
    </form>
  );
}
