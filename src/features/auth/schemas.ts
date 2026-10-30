import { z } from 'zod';
import {
  emailSchema,
  newPasswordSchema,
  phoneSchema,
  personNameSchema,
  requiredPasswordSchema,
} from '@/shared/lib/validation';

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredPasswordSchema,
});

export const registerSchema = z.object({
  firstName: personNameSchema('Ad'),
  lastName: personNameSchema('Soyad'),
  email: emailSchema,
  phone: phoneSchema,
  password: newPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    // Frontend-only: catches typos, never sent to the backend
    confirmPassword: z.string().min(1, 'Yeni şifreyi tekrar girin'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Şifreler eşleşmiyor',
  });

/** One-time token from the links in verification and password reset e-mails. */
export const linkTokenSchema = z.string().trim().min(1);

export type LoginFormInput = z.input<typeof loginSchema>;
export type RegisterFormInput = z.input<typeof registerSchema>;
