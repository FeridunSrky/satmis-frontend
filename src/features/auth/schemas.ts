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

export type LoginFormInput = z.input<typeof loginSchema>;
export type RegisterFormInput = z.input<typeof registerSchema>;
