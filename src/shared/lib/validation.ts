import { z } from 'zod';

// Mirrors the backend Bean Validation rules so users see errors before submitting
const EMAIL_MAX_LENGTH = 100;
const NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;
// People type "0532 123 45 67" or "(0532) 123-45-67"; the backend only accepts digits
const PHONE_FORMATTING_CHARACTERS = /[\s\-().]/g;

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-posta adresi zorunludur')
  .max(EMAIL_MAX_LENGTH, `E-posta adresi en fazla ${EMAIL_MAX_LENGTH} karakter olabilir`)
  .pipe(z.email('Geçerli bir e-posta adresi girin'));

export const requiredPasswordSchema = z.string().min(1, 'Şifre zorunludur');

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`)
  .max(PASSWORD_MAX_LENGTH, `Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir`);

export function personNameSchema(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} zorunludur`)
    .max(NAME_MAX_LENGTH, `${label} en fazla ${NAME_MAX_LENGTH} karakter olabilir`);
}

export const optionalPhoneSchema = z
  .string()
  .transform((value) => value.replace(PHONE_FORMATTING_CHARACTERS, ''))
  .refine((value) => value === '' || PHONE_PATTERN.test(value), {
    message: 'Telefon numarası 10-15 haneli olmalıdır (örn. 05321234567)',
  })
  .transform((value) => (value === '' ? undefined : value));
