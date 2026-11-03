import axios from 'axios';
import { z } from 'zod';

export const NETWORK_ERROR_MESSAGE = 'Sunucuya ulaşılamıyor, lütfen tekrar deneyin';
const UNEXPECTED_ERROR_MESSAGE = 'Beklenmeyen bir hata oluştu, lütfen tekrar deneyin';

export const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR_MIN = 500;

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
export type ApiErrorCode =
  | 'PHONE_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'REFRESH_TOKEN_ROTATED'
  | 'IMAGE_LIMIT_REACHED'
  | 'IMAGE_NOT_UPLOADED'
  | 'IMAGE_INVALID'
  | 'IMAGE_NOT_AVAILABLE'
  | 'SALE_PRICE_OUT_OF_RANGE'
  | 'COMMENT_LIMIT_REACHED'
  | 'REPLY_LIMIT_REACHED'
  | 'ATTACHMENT_LIMIT_REACHED'
  | 'ATTACHMENT_NOT_UPLOADED'
  | 'ATTACHMENT_INVALID'
  | 'ATTACHMENT_NOT_AVAILABLE';

/** Listing creation is refused because the user's profile has no phone number. */
export const PHONE_REQUIRED_CODE: ApiErrorCode = 'PHONE_REQUIRED';
/** Listing creation is refused until the user verifies their e-mail address. */
export const EMAIL_NOT_VERIFIED_CODE: ApiErrorCode = 'EMAIL_NOT_VERIFIED';
/** A 401 on refresh because another tab rotated the cookie moments ago; the session is still valid. */
export const REFRESH_TOKEN_ROTATED_CODE: ApiErrorCode = 'REFRESH_TOKEN_ROTATED';
/** `complete` found no file in storage: the PUT never happened or failed. */
export const IMAGE_NOT_UPLOADED_CODE: ApiErrorCode = 'IMAGE_NOT_UPLOADED';
/** The stored file is not the declared image type or size; its id is no longer usable. */
export const IMAGE_INVALID_CODE: ApiErrorCode = 'IMAGE_INVALID';
/** A listing save referenced an image that is gone, unfinished or not the user's. */
export const IMAGE_NOT_AVAILABLE_CODE: ApiErrorCode = 'IMAGE_NOT_AVAILABLE';
/** The sale price is outside 80–110 % of the listing price; `message` states the range. */
export const SALE_PRICE_OUT_OF_RANGE_CODE: ApiErrorCode = 'SALE_PRICE_OUT_OF_RANGE';
/** The user already used both comments allowed per listing; deleted and rejected ones count. */
export const COMMENT_LIMIT_REACHED_CODE: ApiErrorCode = 'COMMENT_LIMIT_REACHED';
/** The owner used both reply attempts on this comment. */
export const REPLY_LIMIT_REACHED_CODE: ApiErrorCode = 'REPLY_LIMIT_REACHED';
/** `complete` found no attachment file in storage: the PUT never happened or failed. */
export const ATTACHMENT_NOT_UPLOADED_CODE: ApiErrorCode = 'ATTACHMENT_NOT_UPLOADED';
/** The stored attachment is not the declared type or size; its id is no longer usable. */
export const ATTACHMENT_INVALID_CODE: ApiErrorCode = 'ATTACHMENT_INVALID';
/** A comment referenced an attachment that is gone, unfinished, foreign or already used. */
export const ATTACHMENT_NOT_AVAILABLE_CODE: ApiErrorCode = 'ATTACHMENT_NOT_AVAILABLE';

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

/**
 * The server could not answer right now (unreachable, throttled or failing). Such an answer says
 * nothing about the request itself, e.g. a refresh failing this way does not end the session.
 */
export function isTemporaryFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return (
    status === undefined || status === HTTP_TOO_MANY_REQUESTS || status >= HTTP_SERVER_ERROR_MIN
  );
}

export function hasStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}
