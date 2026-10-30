import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { PasswordField } from '@/shared/components/PasswordField';
import { TextField } from '@/shared/components/TextField';
import { useRetryCooldown } from '@/shared/hooks/useRetryCooldown';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { PASSWORD_MIN_LENGTH } from '@/shared/lib/validation';
import { useRegister } from '../hooks/useAuthMutations';
import { registerSchema } from '../schemas';

const REGISTER_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'password'] as const;
const HTTP_CONFLICT = 409;

// The backend returns a token pair on 201, so a successful registration is also a login
export function RegisterForm() {
  const registerMutation = useRegister();
  const { isCoolingDown, startCooldown } = useRetryCooldown();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values);
    } catch (error) {
      const apiError = toApiError(error);
      startCooldown(apiError);
      applyServerErrors(apiError, setError, {
        formFields: REGISTER_FIELDS,
        statusFields: {
          [HTTP_CONFLICT]: {
            field: 'email',
            message: 'Bu e-posta adresiyle kayıtlı bir hesap var',
          },
        },
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={errors.root?.server?.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Ad"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label="Soyad"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>
      <TextField
        label="E-posta"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Telefon"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="0532 123 45 67"
        hint="Alıcılar ilanların için seni bu numaradan arar."
        error={errors.phone?.message}
        {...register('phone')}
      />
      <PasswordField
        label="Şifre"
        autoComplete="new-password"
        hint={`En az ${PASSWORD_MIN_LENGTH} karakter.`}
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" size="lg" fullWidth disabled={isSubmitting || isCoolingDown}>
        {isSubmitting ? 'Gönderiliyor...' : 'Hesap oluştur'}
      </Button>
    </form>
  );
}
