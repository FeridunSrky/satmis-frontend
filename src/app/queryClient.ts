import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

const MAX_QUERY_RETRIES = 2;
export const STALE_TIME_MS = 30_000;

// 4xx answers will not change on retry; only network failures and 5xx are worth repeating
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === undefined || status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: STALE_TIME_MS, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
