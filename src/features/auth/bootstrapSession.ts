import { useAuthStore } from './authStore';
import { refreshSession } from './refreshSession';
import { readRefreshToken } from './tokenStorage';

let bootstrapPromise: Promise<void> | null = null;

/**
 * Restores the session on startup. Memoised at module level because StrictMode runs effects
 * twice in development, and a second refresh with the same token would log the user out.
 */
export function bootstrapSession(): Promise<void> {
  bootstrapPromise ??= restoreSession();
  return bootstrapPromise;
}

async function restoreSession(): Promise<void> {
  if (useAuthStore.getState().status !== 'bootstrapping') {
    return;
  }
  if (!readRefreshToken()) {
    markAnonymous();
    return;
  }
  try {
    await refreshSession();
  } catch {
    // Rejected tokens are already cleared by refreshSession; after a network error the token
    // is kept so the next page load can try again, but the user continues as a guest for now
    markAnonymous();
  }
}

function markAnonymous(): void {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
}
