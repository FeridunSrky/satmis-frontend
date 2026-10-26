import axios from 'axios';
import { z } from 'zod';

export const NETWORK_ERROR_MESSAGE = 'Sunucuya ulaşılamıyor, lütfen tekrar deneyin';
const UNEXPECTED_ERROR_MESSAGE = 'Beklenmeyen bir hata oluştu, lütfen tekrar deneyin';

// Parsed defensively: the backend is developed in parallel and may not match the contract yet
const errorBodySchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
});

export type ApiError =
  | { kind: 'network'; message: string }
  | {
      kind: 'http';
      status: number;
      code?: string;
      message: string;
      fieldErrors: Record<string, string>;
    };

/** Listing creation is refused because the user's profile has no phone number. */
export const PHONE_REQUIRED_CODE = 'PHONE_REQUIRED';

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { kind: 'network', message: NETWORK_ERROR_MESSAGE };
  }
  const parsedBody = errorBodySchema.safeParse(error.response.data);
  const body = parsedBody.success ? parsedBody.data : {};
  return {
    kind: 'http',
    status: error.response.status,
    ...(body.code && { code: body.code }),
    message: body.message?.trim() || UNEXPECTED_ERROR_MESSAGE,
    fieldErrors: body.errors ?? {},
  };
}

export function hasStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}
