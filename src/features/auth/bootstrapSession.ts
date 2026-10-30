import { toast } from 'sonner';
import { useAuthStore } from './authStore';
import { isOriginRejected, ORIGIN_REJECTED_MESSAGE, refreshSession } from './refreshSession';
import { removeLegacyTokens } from './tokenStorage';

let bootstrapPromise: Promise<void> | null = null;

/**
 * Restores the session on startup from the httpOnly refresh cookie, which JavaScript cannot see,
 * so the only way to know whether one exists is to ask. Memoised at module level because
 * StrictMode runs effects twice in development, and a second refresh would race the first.
 */
export function bootstrapSession(): Promise<void> {
  bootstrapPromise ??= restoreSession();
  return bootstrapPromise;
}

async function restoreSession(): Promise<void> {
  removeLegacyTokens();
  if (useAuthStore.getState().status !== 'bootstrapping') {
    return;
  }
  try {
    await refreshSession();
  } catch (error) {
    // No cookie, an expired one, or an unreachable backend: the visitor continues as a guest
    if (isOriginRejected(error)) {
      toast.error(ORIGIN_REJECTED_MESSAGE);
    }
    markAnonymous();
  }
}

function markAnonymous(): void {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
}
