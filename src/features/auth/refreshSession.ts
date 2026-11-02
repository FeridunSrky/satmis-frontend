import axios from 'axios';
import {
  hasStatus,
  isTemporaryFailure,
  REFRESH_TOKEN_ROTATED_CODE,
  toApiError,
} from '@/shared/api/apiError';
import type { AuthResponse } from '@/shared/api/types';
import { refresh } from './api/authApi';
import { useAuthStore } from './authStore';

const REFRESH_LOCK_NAME = 'satmis-refresh';
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const GATEWAY_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);
// Spreads the retries of tabs that failed at the same moment
const MAX_JITTER_RATIO = 0.5;

/** Shown instead of the backend's 403 text, which is about request origins, not the user. */
export const ORIGIN_REJECTED_MESSAGE = 'Oturum doğrulanamadı, lütfen tekrar giriş yapın.';

/** One retry per delay when a refresh gets no answer from the backend itself. */
export interface RefreshRetryPolicy {
  unreachableRetryDelaysMs: readonly number[];
}

// If the backend rotated the cookie but its answer was lost, a retry within 30 s gets
// REFRESH_TOKEN_ROTATED and ends only this session; a later one counts as theft and ends every
// session of the user. So a mid-session refresh retries after ~2 s instead of on the next request
const MID_SESSION_RETRY_POLICY: RefreshRetryPolicy = { unreachableRetryDelaysMs: [2000] };

interface RetryBudget {
  unreachableRetryDelaysMs: readonly number[];
  rotatedRetryLeft: boolean;
}

let refreshInFlight: Promise<void> | null = null;

/**
 * The backend rotates the refresh cookie and treats reuse of an old one as theft (it revokes every
 * session). So within a tab all callers share one refresh, retries included (a caller joining one
 * in flight gets its retry policy), and across tabs the Web Lock makes the refreshes take turns,
 * each sending the cookie the previous one left behind.
 */
export function refreshSession(
  retryPolicy: RefreshRetryPolicy = MID_SESSION_RETRY_POLICY,
): Promise<void> {
  refreshInFlight ??= withRefreshLock(() => rotateTokens(retryPolicy)).finally(() => {
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

async function rotateTokens(retryPolicy: RefreshRetryPolicy): Promise<void> {
  try {
    const session = await refreshWithinBudget({ ...retryPolicy, rotatedRetryLeft: true });
    useAuthStore.getState().setSession(session);
  } catch (error) {
    if (isRejectedByServer(error)) {
      useAuthStore.getState().clearSession();
    }
    throw error;
  }
}

// Unreachable retries and the rotated retry have separate budgets, spent in whatever order the
// failures come, so the attempts stay bounded; a failure with no retry left is passed on
async function refreshWithinBudget(budget: RetryBudget): Promise<AuthResponse> {
  try {
    return await refresh();
  } catch (error) {
    const [delayMs, ...laterDelaysMs] = budget.unreachableRetryDelaysMs;
    if (delayMs !== undefined && isUnreachable(error)) {
      await wait(withJitter(delayMs));
      return refreshWithinBudget({ ...budget, unreachableRetryDelaysMs: laterDelaysMs });
    }
    if (budget.rotatedRetryLeft && isRotatedElsewhere(error)) {
      // Usually another tab won the race and the browser now holds its new cookie. After a lost
      // answer the cookie is unchanged, so this retry is refused too and the session ends
      return refreshWithinBudget({ ...budget, rotatedRetryLeft: false });
    }
    throw error;
  }
}

// No answer at all, or a gateway's: the refresh code did not run, or it ran and the answer was lost
function isUnreachable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === undefined || GATEWAY_STATUSES.has(status);
}

function isRotatedElsewhere(error: unknown): boolean {
  const apiError = toApiError(error);
  return (
    apiError.kind === 'http' &&
    apiError.status === HTTP_UNAUTHORIZED &&
    apiError.code === REFRESH_TOKEN_ROTATED_CODE
  );
}

// Only an actual answer about the cookie ends the session; temporary failures keep it for a retry
function isRejectedByServer(error: unknown): boolean {
  return axios.isAxiosError(error) && !isTemporaryFailure(error);
}

function withJitter(delayMs: number): number {
  return delayMs + Math.random() * delayMs * MAX_JITTER_RATIO;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
