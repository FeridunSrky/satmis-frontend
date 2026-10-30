import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { registerAuthHandlers } from '@/shared/api/http';
import { buildLoginPath } from '@/shared/lib/safeRedirect';
import { useAuthStore } from './authStore';
import { isOriginRejected, ORIGIN_REJECTED_MESSAGE, refreshSession } from './refreshSession';
import { openSessionChannel } from './sessionChannel';

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
      if (isOriginRejected(refreshError)) {
        toast.error(ORIGIN_REJECTED_MESSAGE);
      } else {
        toast.info('Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.');
      }
      navigate(buildLoginPath(getCurrentPath()));
    },
  });

  // Logging out in one tab deletes the shared refresh cookie; follow along in the others
  return openSessionChannel(() => {
    if (useAuthStore.getState().status === 'authenticated') {
      useAuthStore.getState().clearSession();
      queryClient.clear();
    }
  });
}

function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response === undefined;
}
