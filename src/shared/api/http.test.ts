import { QueryClient } from '@tanstack/react-query';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { installAuth } from '@/features/auth/installAuth';
import { readRefreshToken, REFRESH_TOKEN_STORAGE_KEY } from '@/features/auth/tokenStorage';
import { getCurrentUser } from '@/features/user/api/userApi';
import { buildAuthResponse, buildErrorResponse, testUser } from '@/test/fixtures';
import { apiUrl, server } from '@/test/server';

interface BackendCounters {
  refreshCalls: number;
  refreshTokensUsed: string[];
  meCalls: number;
}

// Simulates the backend: only the rotated access token is accepted, and each refresh token works once
function mockBackend({ refreshSucceeds = true, meAlwaysUnauthorized = false } = {}) {
  const counters: BackendCounters = { refreshCalls: 0, refreshTokensUsed: [], meCalls: 0 };
  server.use(
    mockHttp.post(apiUrl('/auth/refresh'), async ({ request }) => {
      const { refreshToken } = (await request.json()) as { refreshToken: string };
      counters.refreshCalls += 1;
      counters.refreshTokensUsed.push(refreshToken);
      if (!refreshSucceeds) {
        return HttpResponse.json(buildErrorResponse(401, 'Oturum geçersiz'), { status: 401 });
      }
      return HttpResponse.json(buildAuthResponse(2));
    }),
    mockHttp.get(apiUrl('/users/me'), ({ request }) => {
      counters.meCalls += 1;
      const isFreshToken = request.headers.get('Authorization') === 'Bearer access-2';
      if (meAlwaysUnauthorized || !isFreshToken) {
        return HttpResponse.json(buildErrorResponse(401, 'Yetkisiz'), { status: 401 });
      }
      return HttpResponse.json(testUser);
    }),
  );
  return counters;
}

describe('http client session handling', () => {
  const navigate = vi.fn<(path: string) => void>();
  let uninstallAuth: () => void;

  beforeEach(() => {
    uninstallAuth = installAuth({
      queryClient: new QueryClient(),
      navigate,
      getCurrentPath: () => '/profil',
    });
    // Session with an expired access token and a still valid refresh token
    useAuthStore.getState().setSession(buildAuthResponse(1));
  });

  afterEach(() => {
    uninstallAuth();
    vi.unstubAllGlobals();
  });

  it('getCurrentUser_accessTokenExpired_refreshesAndRetriesOnce', async () => {
    const counters = mockBackend();

    await expect(getCurrentUser()).resolves.toEqual(testUser);

    expect(counters.refreshCalls).toBe(1);
    expect(counters.meCalls).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe('access-2');
    expect(readRefreshToken()).toBe('refresh-2');
  });

  it('getCurrentUser_retryAlsoUnauthorized_doesNotRetryAgain', async () => {
    const counters = mockBackend({ meAlwaysUnauthorized: true });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 401 } });

    expect(counters.refreshCalls).toBe(1);
    expect(counters.meCalls).toBe(2);
  });

  it('concurrentRequests_bothUnauthorized_refreshIsCalledOnlyOnce', async () => {
    const counters = mockBackend();

    const users = await Promise.all([getCurrentUser(), getCurrentUser(), getCurrentUser()]);

    expect(users).toEqual([testUser, testUser, testUser]);
    expect(counters.refreshCalls).toBe(1);
    expect(counters.refreshTokensUsed).toEqual(['refresh-1']);
  });

  it('refreshFails_clearsSessionAndRedirectsToLogin', async () => {
    mockBackend({ refreshSucceeds: false });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 401 } });

    expect(useAuthStore.getState()).toMatchObject({
      status: 'anonymous',
      user: null,
      accessToken: null,
    });
    expect(readRefreshToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/giris?next=%2Fprofil');
  });

  it('refreshUnderLock_otherTabRotatedToken_usesLatestStoredToken', async () => {
    const counters = mockBackend();
    // Another tab finishes its own rotation while this tab waits for the lock
    vi.stubGlobal('navigator', {
      ...navigator,
      locks: {
        request: (_name: string, task: () => Promise<void>) => {
          window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-from-other-tab');
          return task();
        },
      },
    });

    await getCurrentUser();

    expect(counters.refreshTokensUsed).toEqual(['refresh-from-other-tab']);
  });
});
