import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import type { UserResponse } from '@/shared/api/types';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { TextField } from '@/shared/components/TextField';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { useUpdateProfile } from '../hooks/useUserQueries';
import { profileSchema, type ProfileFormInput } from '../schemas';

const PROFILE_FIELDS = ['firstName', 'lastName', 'phone'] as const;

interface ProfileFormProps {
  user: UserResponse;
}

function toFormValues(user: UserResponse): ProfileFormInput {
  return { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    // Fresh data from GET /users/me flows in without overwriting what the user is typing
    values: toFormValues(user),
    resetOptions: { keepDirtyValues: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedUser = await updateProfile.mutateAsync(values);
      reset(toFormValues(updatedUser));
      toast.success('Profil bilgileriniz kaydedildi');
    } catch (error) {
      applyServerErrors(toApiError(error), setError, { formFields: PROFILE_FIELDS });
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
        value={user.email}
        readOnly
        hint="E-posta adresi şu an değiştirilemiyor."
      />
      <TextField
        label="Telefon (isteğe bağlı)"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="0532 123 45 67"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Gönderiliyor...' : 'Değişiklikleri kaydet'}
        </Button>
      </div>
    </form>
  );
}
