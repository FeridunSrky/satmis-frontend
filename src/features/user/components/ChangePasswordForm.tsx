import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { endSession } from '@/features/auth/endSession';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { PasswordField } from '@/shared/components/PasswordField';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { PASSWORD_MIN_LENGTH } from '@/shared/lib/validation';
import { useChangePassword } from '../hooks/useUserQueries';
import { changePasswordSchema } from '../schemas';

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;
const HTTP_BAD_REQUEST = 400;

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
    } catch (error) {
      applyServerErrors(toApiError(error), setError, {
        formFields: PASSWORD_FIELDS,
        // The backend answers a wrong current password with a plain 400 message
        statusFields: { [HTTP_BAD_REQUEST]: { field: 'currentPassword' } },
      });
      return;
    }
    // The backend revokes every refresh token on password change, so this session is over.
    // ProtectedRoute then sends the user to /giris?next=/profil to sign in again.
    await endSession(queryClient);
    toast.success('Şifreniz değişti, lütfen tekrar giriş yapın');
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      <PasswordField
        label="Mevcut şifre"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
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
      <p className="text-sm text-muted">
        Şifreni değiştirdiğinde tüm cihazlardaki oturumların kapanır.
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Gönderiliyor...' : 'Şifreyi değiştir'}
        </Button>
      </div>
    </form>
  );
}
