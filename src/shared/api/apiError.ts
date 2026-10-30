import axios from 'axios';
import { z } from 'zod';

export const NETWORK_ERROR_MESSAGE = 'Sunucuya ulaşılamıyor, lütfen tekrar deneyin';
const UNEXPECTED_ERROR_MESSAGE = 'Beklenmeyen bir hata oluştu, lütfen tekrar deneyin';

export const HTTP_TOO_MANY_REQUESTS = 429;

// Parsed defensively: the backend is developed in parallel and may not match the contract yet
const errorBodySchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
});

// The backend sends delay-seconds; the HTTP-date form is not used by it, so it is ignored
const retryAfterSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value));

export type ApiError =
  | { kind: 'network'; message: string }
  | {
      kind: 'http';
      status: number;
      code?: string;
      message: string;
      fieldErrors: Record<string, string>;
      /** From the `Retry-After` header of a 429 answer. */
      retryAfterSeconds?: number;
    };

/** Error codes the frontend reacts to; the backend omits `code` for every other error. */
export type ApiErrorCode = 'PHONE_REQUIRED' | 'EMAIL_NOT_VERIFIED';

/** Listing creation is refused because the user's profile has no phone number. */
export const PHONE_REQUIRED_CODE: ApiErrorCode = 'PHONE_REQUIRED';
/** Listing creation is refused until the user verifies their e-mail address. */
export const EMAIL_NOT_VERIFIED_CODE: ApiErrorCode = 'EMAIL_NOT_VERIFIED';

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { kind: 'network', message: NETWORK_ERROR_MESSAGE };
  }
  const parsedBody = errorBodySchema.safeParse(error.response.data);
  const body = parsedBody.success ? parsedBody.data : {};
  const retryAfter = retryAfterSchema.safeParse(error.response.headers['retry-after']);
  return {
    kind: 'http',
    status: error.response.status,
    ...(body.code && { code: body.code }),
    message: body.message?.trim() || UNEXPECTED_ERROR_MESSAGE,
    fieldErrors: body.errors ?? {},
    ...(retryAfter.success && { retryAfterSeconds: retryAfter.data }),
  };
}

export function hasStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}
