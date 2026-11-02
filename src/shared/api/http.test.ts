import { QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { installAuth } from '@/features/auth/installAuth';
import { getCurrentUser } from '@/features/user/api/userApi';
import { buildAuthResponse, buildErrorResponse, testUser } from '@/test/fixtures';
import { apiUrl, server } from '@/test/server';

type RefreshAnswer =
  | 'ok'
  | 'expired'
  | 'rotated'
  | 'rateLimited'
  | 'forbidden'
  | 'serverError'
  | 'unavailable'
  | 'networkError';

interface BackendCounters {
  refreshCalls: number;
  refreshBodies: string[];
  /** Fake-clock time of each refresh request. */
  refreshTimes: number[];
  meCalls: number;
}

const RATE_LIMIT_MESSAGE = 'Çok fazla deneme yaptınız, lütfen 60 saniye sonra tekrar deneyin';
const FAKE_TIME_STEP_MS = 100;
const FAKE_TIME_LIMIT_MS = 10_000;

function refreshResponse(answer: RefreshAnswer): Response {
  switch (answer) {
    case 'ok':
      return HttpResponse.json(buildAuthResponse(2));
    case 'expired':
      return HttpResponse.json(buildErrorResponse(401, 'Oturum geçersiz'), { status: 401 });
    case 'rotated':
      return HttpResponse.json(
        {
          ...buildErrorResponse(401, 'Oturum başka sekmede yenilendi'),
          code: 'REFRESH_TOKEN_ROTATED',
        },
        { status: 401 },
      );
    case 'rateLimited':
      return HttpResponse.json(buildErrorResponse(429, RATE_LIMIT_MESSAGE), {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    case 'forbidden':
      return HttpResponse.json(buildErrorResponse(403, 'İstek kaynağı doğrulanamadı'), {
        status: 403,
      });
    case 'serverError':
      return HttpResponse.json(buildErrorResponse(500, 'Beklenmeyen bir hata oluştu'), {
        status: 500,
      });
    case 'unavailable':
      return HttpResponse.json(buildErrorResponse(503, 'Depoya ulaşılamıyor'), { status: 503 });
    case 'networkError':
      return HttpResponse.error();
  }
}

// Simulates the backend: only the rotated access token is accepted. The refresh token itself sits
// in an httpOnly cookie that the browser sends, so the mock only answers in the given order.
function mockBackend({
  refreshAnswers = [] as RefreshAnswer[],
  meAlwaysUnauthorized = false,
} = {}) {
  const counters: BackendCounters = {
    refreshCalls: 0,
    refreshBodies: [],
    refreshTimes: [],
    meCalls: 0,
  };
  server.use(
    mockHttp.post(apiUrl('/auth/refresh'), async ({ request }) => {
      counters.refreshTimes.push(Date.now());
      counters.refreshBodies.push(await request.text());
      const answer = refreshAnswers[counters.refreshCalls] ?? 'ok';
      counters.refreshCalls += 1;
      return refreshResponse(answer);
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

function expectSessionEnded(navigate: (path: string) => void) {
  expect(useAuthStore.getState()).toMatchObject({
    status: 'anonymous',
    user: null,
    accessToken: null,
  });
  expect(navigate).toHaveBeenCalledWith('/giris?next=%2Fprofil');
}

function expectSessionKept(navigate: (path: string) => void) {
  expect(useAuthStore.getState()).toMatchObject({
    status: 'authenticated',
    accessToken: 'access-1',
    user: testUser,
  });
  expect(navigate).not.toHaveBeenCalled();
}

// The retry after an unanswered refresh waits about 2 s; a fake clock skips that wait
function useFakeClock() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
}

// Small steps let the mocked requests settle in between, so each wait starts when it would for real
async function settleWithFakeTime(request: Promise<unknown>): Promise<void> {
  let settled = false;
  const markSettled = () => {
    settled = true;
  };
  void request.then(markSettled, markSettled);
  for (
    let elapsedMs = 0;
    !settled && elapsedMs < FAKE_TIME_LIMIT_MS;
    elapsedMs += FAKE_TIME_STEP_MS
  ) {
    await vi.advanceTimersByTimeAsync(FAKE_TIME_STEP_MS);
  }
  if (!settled) {
    throw new Error(`Request still pending after ${FAKE_TIME_LIMIT_MS} ms of fake time`);
  }
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
    // Session with an expired access token and a still valid refresh cookie
    useAuthStore.getState().setSession(buildAuthResponse(1));
  });

  afterEach(() => {
    uninstallAuth();
    vi.unstubAllGlobals();
  });

  it('getCurrentUser_accessTokenExpired_refreshesWithoutBodyAndRetriesOnce', async () => {
    const counters = mockBackend();

    await expect(getCurrentUser()).resolves.toEqual(testUser);

    expect(counters.refreshCalls).toBe(1);
    expect(counters.refreshBodies).toEqual(['']);
    expect(counters.meCalls).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe('access-2');
  });

  it('getCurrentUser_retryAlsoUnauthorized_doesNotRetryAgain', async () => {
    const counters = mockBackend({ meAlwaysUnauthorized: true });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 401 } });

    expect(counters.refreshCalls).toBe(1);
    expect(counters.meCalls).toBe(2);
  });

  it('concurrentRequests_allUnauthorized_refreshIsCalledOnlyOnce', async () => {
    const counters = mockBackend();

    const users = await Promise.all([getCurrentUser(), getCurrentUser(), getCurrentUser()]);

    expect(users).toEqual([testUser, testUser, testUser]);
    expect(counters.refreshCalls).toBe(1);
  });

  it('refreshRotatedInOtherTab_retriesOnceAndKeepsSession', async () => {
    const counters = mockBackend({ refreshAnswers: ['rotated', 'ok'] });

    await expect(getCurrentUser()).resolves.toEqual(testUser);

    expect(counters.refreshCalls).toBe(2);
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-2',
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('refreshRotatedTwice_endsSessionWithoutLooping', async () => {
    const counters = mockBackend({ refreshAnswers: ['rotated', 'rotated', 'rotated'] });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 401 } });

    expect(counters.refreshCalls).toBe(2);
    expectSessionEnded(navigate);
  });

  it('refreshExpired_clearsSessionAndRedirectsToLogin', async () => {
    mockBackend({ refreshAnswers: ['expired'] });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 401 } });

    expectSessionEnded(navigate);
  });

  it('refreshOriginRejected_clearsSessionAndRedirectsToLogin', async () => {
    mockBackend({ refreshAnswers: ['forbidden'] });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 401 } });

    expectSessionEnded(navigate);
  });

  it('refreshRateLimited_keepsSessionAndPassesThe429ToTheCaller', async () => {
    mockBackend({ refreshAnswers: ['rateLimited'] });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 429 } });

    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-1',
      user: testUser,
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('refreshServerError_isNotRetriedAndKeepsSession', async () => {
    const counters = mockBackend({ refreshAnswers: ['serverError', 'ok'] });

    await expect(getCurrentUser()).rejects.toMatchObject({ response: { status: 500 } });

    expect(counters.refreshCalls).toBe(1);
    expectSessionKept(navigate);
  });

  describe('when a refresh gets no answer from the backend', () => {
    it('refreshNetworkErrorThenOk_retriesOnceAfterAboutTwoSecondsAndKeepsSession', async () => {
      useFakeClock();
      const counters = mockBackend({ refreshAnswers: ['networkError', 'ok'] });

      const request = getCurrentUser();
      await settleWithFakeTime(request);

      await expect(request).resolves.toEqual(testUser);
      expect(counters.refreshCalls).toBe(2);
      const [firstAttemptAt = 0, retryAt = 0] = counters.refreshTimes;
      // 2 s plus jitter: not at once, and well inside the backend's 30 s window for a rotated token
      expect(retryAt - firstAttemptAt).toBeGreaterThanOrEqual(2000);
      expect(retryAt - firstAttemptAt).toBeLessThan(5000);
      expect(useAuthStore.getState().accessToken).toBe('access-2');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('refreshNetworkErrorThenRotatedTwice_endsSessionAfterThreeAttempts', async () => {
      useFakeClock();
      // The lost answer had rotated the cookie, so both later attempts still send the old one
      const counters = mockBackend({
        refreshAnswers: ['networkError', 'rotated', 'rotated', 'ok'],
      });

      const request = getCurrentUser();
      await settleWithFakeTime(request);

      await expect(request).rejects.toMatchObject({ response: { status: 401 } });
      expect(counters.refreshCalls).toBe(3);
      expectSessionEnded(navigate);
    });

    it('refreshRotatedThenNetworkError_stillGetsItsOneRetryForTheMissingAnswer', async () => {
      useFakeClock();
      const counters = mockBackend({ refreshAnswers: ['rotated', 'networkError', 'ok'] });

      const request = getCurrentUser();
      await settleWithFakeTime(request);

      await expect(request).resolves.toEqual(testUser);
      expect(counters.refreshCalls).toBe(3);
    });

    it.each([
      ['unavailable', { response: { status: 503 } }],
      ['networkError', { code: 'ERR_NETWORK' }],
    ] as const)('refresh%sTwice_retriesOnlyOnceAndKeepsSession', async (answer, failure) => {
      useFakeClock();
      const counters = mockBackend({ refreshAnswers: [answer, answer, 'ok'] });

      const request = getCurrentUser();
      await settleWithFakeTime(request);

      await expect(request).rejects.toMatchObject(failure);
      expect(counters.refreshCalls).toBe(2);
      expectSessionKept(navigate);
    });
  });

  it('refresh_runsInsideTheCrossTabWebLock', async () => {
    mockBackend();
    const lockNames: string[] = [];
    vi.stubGlobal('navigator', {
      ...navigator,
      locks: {
        request: (name: string, task: () => Promise<void>) => {
          lockNames.push(name);
          return task();
        },
      },
    });

    await getCurrentUser();

    expect(lockNames).toEqual(['satmis-refresh']);
  });

  it('logoutInAnotherTab_endsThisSessionToo', async () => {
    const otherTab = new BroadcastChannel('satmis-session');
    onTestFinished(() => otherTab.close());

    otherTab.postMessage('logged-out');

    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
  });
});
