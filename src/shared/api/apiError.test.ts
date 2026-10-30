import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { login } from '@/features/auth/api/authApi';
import { buildErrorResponse } from '@/test/fixtures';
import { apiUrl, server } from '@/test/server';
import { toApiError } from './apiError';

const CREDENTIALS = { email: 'ayse@example.com', password: 'GizliSifre123' };

async function captureLoginError(): Promise<unknown> {
  try {
    await login(CREDENTIALS);
  } catch (error) {
    return error;
  }
  throw new Error('Expected the login request to fail');
}

function mockLoginAnswer(status: number, headers: Record<string, string> = {}) {
  server.use(
    mockHttp.post(apiUrl('/auth/login'), () =>
      HttpResponse.json(buildErrorResponse(status, 'Çok fazla deneme yaptınız'), {
        status,
        headers,
      }),
    ),
  );
}

describe('toApiError', () => {
  it('rateLimited_readsRetryAfterSeconds', async () => {
    mockLoginAnswer(429, { 'Retry-After': '60' });

    expect(toApiError(await captureLoginError())).toMatchObject({
      kind: 'http',
      status: 429,
      message: 'Çok fazla deneme yaptınız',
      retryAfterSeconds: 60,
    });
  });

  it('retryAfterNotInSeconds_isLeftOut', async () => {
    mockLoginAnswer(429, { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' });

    expect(toApiError(await captureLoginError())).not.toHaveProperty('retryAfterSeconds');
  });

  it('noRetryAfterHeader_isLeftOut', async () => {
    mockLoginAnswer(400);

    expect(toApiError(await captureLoginError())).not.toHaveProperty('retryAfterSeconds');
  });
});
