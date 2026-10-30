import axios, { type InternalAxiosRequestConfig } from 'axios';
import { hasStatus, HTTP_TOO_MANY_REQUESTS } from './apiError';

const API_BASE_URL = '/api';
const REQUEST_TIMEOUT_MS = 15_000;
const HTTP_UNAUTHORIZED = 401;

export interface AuthHandlers {
  getAccessToken: () => string | null;
  /** Must be single-flight: concurrent callers share one refresh request. */
  refreshSession: () => Promise<void>;
  onSessionExpired: (refreshError: unknown) => void;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  authRetried?: boolean;
}

let authHandlers: AuthHandlers | null = null;

// Injected by the auth feature so the shared layer does not depend on it
export function registerAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

/** For protected endpoints: attaches the access token and refreshes once on 401. */
export const http = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

/** For /auth endpoints: no interceptors, so refresh can never recurse into itself. */
export const authHttp = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

http.interceptors.request.use((config) => {
  const accessToken = authHandlers?.getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

http.interceptors.response.use(undefined, async (error: unknown) => {
  const config = getRetriableConfig(error);
  if (!config || !authHandlers) {
    throw error;
  }
  config.authRetried = true;
  try {
    await authHandlers.refreshSession();
  } catch (refreshError) {
    // A throttled refresh says nothing about the session; the caller shows the 429 message
    if (hasStatus(refreshError, HTTP_TOO_MANY_REQUESTS)) {
      throw refreshError;
    }
    authHandlers.onSessionExpired(refreshError);
    throw error;
  }
  return http.request(config);
});

function getRetriableConfig(error: unknown): RetriableRequestConfig | null {
  if (!axios.isAxiosError(error) || error.response?.status !== HTTP_UNAUTHORIZED) {
    return null;
  }
  const config = error.config as RetriableRequestConfig | undefined;
  const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false;
  if (!config || config.authRetried || isAuthEndpoint) {
    return null;
  }
  return config;
}
