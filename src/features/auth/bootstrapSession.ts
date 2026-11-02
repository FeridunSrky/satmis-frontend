import { toast } from 'sonner';
import { isTemporaryFailure } from '@/shared/api/apiError';
import { useAuthStore } from './authStore';
import {
  isOriginRejected,
  ORIGIN_REJECTED_MESSAGE,
  refreshSession,
  type RefreshRetryPolicy,
} from './refreshSession';
import { removeLegacyTokens } from './tokenStorage';

// The whole page waits on this refresh, so two quick retries bridge a brief backend restart
const STARTUP_RETRY_POLICY: RefreshRetryPolicy = { unreachableRetryDelaysMs: [300, 1000] };
export const SERVER_UNAVAILABLE_MESSAGE =
  'Sunucuya şu an ulaşılamıyor. Oturumunuz kapanmadı; birazdan sayfayı yenileyin.';

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
    await refreshSession(STARTUP_RETRY_POLICY);
  } catch (error) {
    // No cookie, an expired one, or a backend that stayed down: the visitor continues as a guest
    if (isOriginRejected(error)) {
      toast.error(ORIGIN_REJECTED_MESSAGE);
    } else if (isTemporaryFailure(error)) {
      toast.error(SERVER_UNAVAILABLE_MESSAGE);
    }
    markAnonymous();
  }
}

function markAnonymous(): void {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
}
