import axios from 'axios';
import { refresh } from './api/authApi';
import { useAuthStore } from './authStore';
import { readRefreshToken } from './tokenStorage';

const REFRESH_LOCK_NAME = 'satmis-refresh';

export class NoRefreshTokenError extends Error {
  constructor() {
    super('No refresh token available');
    this.name = 'NoRefreshTokenError';
  }
}

let refreshInFlight: Promise<void> | null = null;

/**
 * The backend rotates refresh tokens and treats reuse of an old one as theft (it revokes every
 * session). So within a tab all callers share one request, and across tabs the Web Lock makes
 * sure the token is read from storage only after any other tab has finished rotating it.
 */
export function refreshSession(): Promise<void> {
  refreshInFlight ??= withRefreshLock(rotateTokens).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function withRefreshLock(task: () => Promise<void>): Promise<void> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK_NAME, task);
  }
  return task();
}

async function rotateTokens(): Promise<void> {
  // Re-read inside the lock: another tab may have rotated the token while this one waited
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    throw new NoRefreshTokenError();
  }
  try {
    const session = await refresh(refreshToken);
    useAuthStore.getState().setSession(session);
  } catch (error) {
    if (isRejectedByServer(error)) {
      useAuthStore.getState().clearSession();
    }
    throw error;
  }
}

// A network failure says nothing about the token, so it is kept for the next attempt
function isRejectedByServer(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response !== undefined;
}
