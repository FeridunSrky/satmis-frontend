import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toApiError, type ApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { PasswordField } from '@/shared/components/PasswordField';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { PASSWORD_MIN_LENGTH } from '@/shared/lib/validation';
import { clearLocalSession } from '../endSession';
import { useResetPassword } from '../hooks/usePasswordReset';
import { resetPasswordSchema } from '../schemas';

const RESET_PASSWORD_FIELDS = ['newPassword', 'confirmPassword'] as const;
const HTTP_BAD_REQUEST = 400;

interface ResetPasswordFormProps {
  token: string;
  /** Called when the backend rejects the link itself (used, expired or unknown). */
  onLinkRejected: (message: string) => void;
}

// A 400 about the password keeps the link usable; any other 400 means the link is dead
function isRejectedLink(apiError: ApiError): boolean {
  return (
    apiError.kind === 'http' &&
    apiError.status === HTTP_BAD_REQUEST &&
    apiError.fieldErrors.newPassword === undefined
  );
}

export function ResetPasswordForm({ token, onLinkRejected }: ResetPasswordFormProps) {
  const resetPassword = useResetPassword();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isCoolingDown, startCooldown } = useRetryCooldown();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    try {
      await resetPassword.mutateAsync({ token, newPassword });
    } catch (error) {
      const apiError = toApiError(error);
      if (isRejectedLink(apiError)) {
        onLinkRejected(apiError.message);
        return;
      }
      startCooldown(apiError);
      applyServerErrors(apiError, setError, { formFields: RESET_PASSWORD_FIELDS });
      return;
    }
    // The backend revoked every refresh token of the account, so any session here is dead
    clearLocalSession(queryClient);
    toast.success('Şifren değişti, yeni şifrenle giriş yap');
    await navigate('/giris', { replace: true });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      <PasswordField
        label="Yeni şifre"
        autoComplete="new-password"
        hint={`En az ${PASSWORD_MIN_LENGTH} karakter.`}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        label="Yeni şifre (tekrar)"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" size="lg" fullWidth disabled={isSubmitting || isCoolingDown}>
        {isSubmitting ? 'Gönderiliyor...' : 'Şifreyi değiştir'}
      </Button>
    </form>
  );
}
