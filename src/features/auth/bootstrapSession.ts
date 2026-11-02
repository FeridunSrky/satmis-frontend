import axios from 'axios';
import { toast } from 'sonner';
import { isTemporaryFailure } from '@/shared/api/apiError';
import { useAuthStore } from './authStore';
import { isOriginRejected, ORIGIN_REJECTED_MESSAGE, refreshSession } from './refreshSession';
import { removeLegacyTokens } from './tokenStorage';

// Gateway answers and network errors mean the request never reached the backend, so the cookie
// was not rotated and sending it again is safe; a brief backend restart then costs a short wait
const RETRY_DELAYS_MS = [300, 1000] as const;
const GATEWAY_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);
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
    await refreshRetryingWhileUnreachable();
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

async function refreshRetryingWhileUnreachable(): Promise<void> {
  for (const delayMs of RETRY_DELAYS_MS) {
    try {
      return await refreshSession();
    } catch (error) {
      if (!isUnreachable(error)) {
        throw error;
      }
      await wait(withJitter(delayMs));
    }
  }
  return refreshSession();
}

function isUnreachable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === undefined || GATEWAY_STATUSES.has(status);
}

function withJitter(delayMs: number): number {
  return delayMs + Math.random() * delayMs * 0.5;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function markAnonymous(): void {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
}
