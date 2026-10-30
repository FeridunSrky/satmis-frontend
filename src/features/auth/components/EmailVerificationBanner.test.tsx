import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildErrorResponse, testUser, unverifiedUser } from '@/test/fixtures';
import { renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const BANNER_TEXT = 'E-posta adresini doğrula.';

function mockResend(response: () => Response) {
  server.use(mockHttp.post(apiUrl('/users/me/email-verification'), response));
}

describe('EmailVerificationBanner', () => {
  it('unverifiedUser_seesBannerWithEmail', async () => {
    signInAs(1, unverifiedUser);
    renderApp('/');

    const banner = await screen.findByRole('region', { name: 'E-posta doğrulama' });
    expect(banner).toHaveTextContent(BANNER_TEXT);
    expect(banner).toHaveTextContent(unverifiedUser.email);
  });

  it('verifiedUser_seesNoBanner', async () => {
    signInAs(1, testUser);
    renderApp('/');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
  });

  it('resend_noContent_showsToast', async () => {
    signInAs(1, unverifiedUser);
    mockResend(() => new HttpResponse(null, { status: 204 }));
    renderApp('/');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Tekrar gönder' }));

    expect(await screen.findByText('Yeni doğrulama linki gönderildi')).toBeInTheDocument();
    expect(screen.getByText(BANNER_TEXT)).toBeInTheDocument();
  });

  it('resend_alreadyVerified_reloadsUserAndHidesBanner', async () => {
    signInAs(1, unverifiedUser);
    mockResend(() =>
      HttpResponse.json(buildErrorResponse(409, 'E-posta adresi zaten doğrulanmış'), {
        status: 409,
      }),
    );
    server.use(mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)));
    renderApp('/');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Tekrar gönder' }));

    await waitFor(() => expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument());
  });

  it('resend_rateLimited_showsBackendMessageAndDisablesButton', async () => {
    signInAs(1, unverifiedUser);
    const message = 'Çok fazla deneme yaptınız, lütfen 60 saniye sonra tekrar deneyin';
    mockResend(() =>
      HttpResponse.json(buildErrorResponse(429, message), {
        status: 429,
        headers: { 'Retry-After': '60' },
      }),
    );
    renderApp('/');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Tekrar gönder' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tekrar gönder' })).toBeDisabled();
  });
});
