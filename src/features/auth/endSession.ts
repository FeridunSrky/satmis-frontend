import type { QueryClient } from '@tanstack/react-query';
import { logout } from './api/authApi';
import { useAuthStore } from './authStore';
import { readRefreshToken } from './tokenStorage';

/**
 * Clears the local session first so the UI reacts immediately; telling the backend is
 * best-effort because the user must end up logged out locally either way.
 */
export async function endSession(queryClient: QueryClient): Promise<void> {
  const refreshToken = readRefreshToken();
  useAuthStore.getState().clearSession();
  queryClient.clear();
  if (!refreshToken) {
    return;
  }
  try {
    await logout(refreshToken);
  } catch {
    console.warn('Logout request failed; the local session was cleared anyway.');
  }
}
