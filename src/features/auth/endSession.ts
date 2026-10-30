import type { QueryClient } from '@tanstack/react-query';
import { logout } from './api/authApi';
import { useAuthStore } from './authStore';
import { announceLoggedOut } from './sessionChannel';

/**
 * Clears the local session first so the UI reacts immediately; telling the backend (which revokes
 * the token and deletes the refresh cookie) is best-effort because the user must end up logged
 * out locally either way.
 */
export async function endSession(queryClient: QueryClient): Promise<void> {
  clearLocalSession(queryClient);
  try {
    await logout();
  } catch {
    console.warn('Logout request failed; the local session was cleared anyway.');
  }
}

/** Forgets tokens and cached user data without telling the backend, e.g. after it revoked them. */
export function clearLocalSession(queryClient: QueryClient): void {
  useAuthStore.getState().clearSession();
  queryClient.clear();
  announceLoggedOut();
}
