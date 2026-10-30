import axios from 'axios';
import {
  hasStatus,
  HTTP_TOO_MANY_REQUESTS,
  REFRESH_TOKEN_ROTATED_CODE,
  toApiError,
} from '@/shared/api/apiError';
import type { AuthResponse } from '@/shared/api/types';
import { refresh } from './api/authApi';
import { useAuthStore } from './authStore';

const REFRESH_LOCK_NAME = 'satmis-refresh';
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

/** Shown instead of the backend's 403 text, which is about request origins, not the user. */
export const ORIGIN_REJECTED_MESSAGE = 'Oturum doğrulanamadı, lütfen tekrar giriş yapın.';

let refreshInFlight: Promise<void> | null = null;

/**
 * The backend rotates the refresh cookie and treats reuse of an old one as theft (it revokes every
 * session). So within a tab all callers share one request, and across tabs the Web Lock makes the
 * refreshes take turns, each sending the cookie the previous one left behind.
 */
export function refreshSession(): Promise<void> {
  refreshInFlight ??= withRefreshLock(rotateTokens).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** The backend refused the refresh because of the request origin (its CSRF check). */
export function isOriginRejected(error: unknown): boolean {
  return hasStatus(error, HTTP_FORBIDDEN);
}

function withRefreshLock(task: () => Promise<void>): Promise<void> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK_NAME, task);
  }
  return task();
}

async function rotateTokens(): Promise<void> {
  try {
    const session = await refreshRetryingOnceIfRotated();
    useAuthStore.getState().setSession(session);
  } catch (error) {
    if (isRejectedByServer(error)) {
      useAuthStore.getState().clearSession();
    }
    throw error;
  }
}

// Exactly one retry: a second REFRESH_TOKEN_ROTATED is treated like any other rejection
async function refreshRetryingOnceIfRotated(): Promise<AuthResponse> {
  try {
    return await refresh();
  } catch (error) {
    if (!isRotatedElsewhere(error)) {
      throw error;
    }
    // Another tab (or browser without Web Locks) won the race; the browser now holds its new cookie
    return refresh();
  }
}

function isRotatedElsewhere(error: unknown): boolean {
  const apiError = toApiError(error);
  return (
    apiError.kind === 'http' &&
    apiError.status === HTTP_UNAUTHORIZED &&
    apiError.code === REFRESH_TOKEN_ROTATED_CODE
  );
}

// A network failure or a rate limit says nothing about the session, so it is kept for the next try
function isRejectedByServer(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response !== undefined &&
    error.response.status !== HTTP_TOO_MANY_REQUESTS
  );
}
