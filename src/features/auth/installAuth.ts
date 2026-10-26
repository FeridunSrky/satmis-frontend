import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { registerAuthHandlers } from '@/shared/api/http';
import { buildLoginPath } from '@/shared/lib/safeRedirect';
import { useAuthStore } from './authStore';
import { refreshSession } from './refreshSession';
import { REFRESH_TOKEN_STORAGE_KEY } from './tokenStorage';

interface InstallAuthOptions {
  queryClient: QueryClient;
  navigate: (path: string) => void;
  getCurrentPath: () => string;
}

/** Wires the session into the HTTP client. Returns a cleanup function. */
export function installAuth({ queryClient, navigate, getCurrentPath }: InstallAuthOptions) {
  registerAuthHandlers({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshSession,
    onSessionExpired: (refreshError) => {
      // Offline is not a logout: keep the session and let the request fail visibly
      if (isNetworkError(refreshError)) {
        return;
      }
      useAuthStore.getState().clearSession();
      queryClient.clear();
      toast.info('Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.');
      navigate(buildLoginPath(getCurrentPath()));
    },
  });

  // Logging out in one tab removes the shared refresh token; follow along in the others
  const handleStorage = (event: StorageEvent) => {
    const loggedOutElsewhere = event.key === REFRESH_TOKEN_STORAGE_KEY && event.newValue === null;
    if (loggedOutElsewhere && useAuthStore.getState().status === 'authenticated') {
      useAuthStore.getState().clearSession();
      queryClient.clear();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response === undefined;
}
