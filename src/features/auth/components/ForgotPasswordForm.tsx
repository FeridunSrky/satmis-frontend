import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { TextField } from '@/shared/components/TextField';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { useForgotPassword } from '../hooks/usePasswordReset';
import { forgotPasswordSchema } from '../schemas';

const FORGOT_PASSWORD_FIELDS = ['email'] as const;

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const { isCoolingDown, startCooldown } = useRetryCooldown();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPassword.mutateAsync(email);
    } catch (error) {
      const apiError = toApiError(error);
      startCooldown(apiError);
      applyServerErrors(apiError, setError, { formFields: FORGOT_PASSWORD_FIELDS });
    }
  });

  // The backend answers 204 for unknown addresses too, so the message must not reveal either case
  if (forgotPassword.isSuccess) {
    return (
      <output className="block rounded-md border-l-4 border-success bg-surface px-4 py-3">
        Bu e-posta adresi kayıtlıysa şifre sıfırlama linki gönderdik. Link 1 saat geçerlidir.
      </output>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      <TextField
        label="E-posta"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" size="lg" fullWidth disabled={isSubmitting || isCoolingDown}>
        {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama linki gönder'}
      </Button>
    </form>
  );
}
