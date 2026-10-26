import { z } from 'zod';
import { newPasswordSchema, optionalPhoneSchema, personNameSchema } from '@/shared/lib/validation';

export const profileSchema = z.object({
  firstName: personNameSchema('Ad'),
  lastName: personNameSchema('Soyad'),
  phone: optionalPhoneSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifrenizi girin'),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Yeni şifreyi tekrar girin'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Şifreler eşleşmiyor',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'Yeni şifre mevcut şifrenizle aynı olamaz',
  });

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ChangePasswordFormInput = z.input<typeof changePasswordSchema>;
