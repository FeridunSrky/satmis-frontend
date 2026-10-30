import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { PasswordField } from '@/shared/components/PasswordField';
import { TextField } from '@/shared/components/TextField';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { useLogin } from '../hooks/useAuthMutations';
import { loginSchema } from '../schemas';

const LOGIN_FIELDS = ['email', 'password'] as const;
const HTTP_UNAUTHORIZED = 401;

// Redirecting after success is handled by GuestRoute once the session is set
export function LoginForm() {
  const loginMutation = useLogin();
  const { isCoolingDown, startCooldown } = useRetryCooldown();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'http' && apiError.status === HTTP_UNAUTHORIZED) {
        setError('root.server', { message: 'E-posta veya şifre hatalı' });
        return;
      }
      startCooldown(apiError);
      applyServerErrors(apiError, setError, { formFields: LOGIN_FIELDS });
    }
  });

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
      <PasswordField
        label="Şifre"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Link
        to="/sifremi-unuttum"
        className="-mt-2 self-end text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
      >
        Şifremi unuttum
      </Link>
      <Button type="submit" size="lg" fullWidth disabled={isSubmitting || isCoolingDown}>
        {isSubmitting ? 'Gönderiliyor...' : 'Giriş yap'}
      </Button>
    </form>
  );
}
