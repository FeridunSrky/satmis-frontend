import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { readRefreshToken } from '@/features/auth/tokenStorage';
import { buildErrorResponse } from '@/test/fixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const NEUTRAL_MESSAGE =
  'Bu e-posta adresi kayıtlıysa şifre sıfırlama linki gönderdik. Link 1 saat geçerlidir.';
const DEAD_LINK_MESSAGE =
  'Şifre sıfırlama linki geçersiz veya süresi dolmuş, yeni bir link isteyin';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    signOutCompletely();
  });

  it('invalidEmail_showsTurkishErrorWithoutRequest', async () => {
    let requestCount = 0;
    server.use(
      mockHttp.post(apiUrl('/auth/forgot-password'), () => {
        requestCount += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/sifremi-unuttum');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-posta'), 'ayse@');
    await user.click(screen.getByRole('button', { name: 'Sıfırlama linki gönder' }));

    expect(await screen.findByText('Geçerli bir e-posta adresi girin')).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it('noContent_replacesFormWithNeutralMessage', async () => {
    let sentBody: unknown;
    server.use(
      mockHttp.post(apiUrl('/auth/forgot-password'), async ({ request }) => {
        sentBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/sifremi-unuttum');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-posta'), 'kimse@example.com');
    await user.click(screen.getByRole('button', { name: 'Sıfırlama linki gönder' }));

    expect(await screen.findByText(NEUTRAL_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText('E-posta')).not.toBeInTheDocument();
    expect(sentBody).toEqual({ email: 'kimse@example.com' });
  });

  it('loginPage_linksToForgotPassword', async () => {
    renderApp('/giris');

    expect(await screen.findByRole('link', { name: 'Şifremi unuttum' })).toHaveAttribute(
      'href',
      '/sifremi-unuttum',
    );
  });
});

async function submitNewPassword(user: UserEvent, password: string, confirmation = password) {
  await user.type(await screen.findByLabelText('Yeni şifre'), password);
  await user.type(screen.getByLabelText('Yeni şifre (tekrar)'), confirmation);
  await user.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }));
}

function mockResetPassword(respond: () => Response) {
  const sentBodies: unknown[] = [];
  server.use(
    mockHttp.post(apiUrl('/auth/reset-password'), async ({ request }) => {
      sentBodies.push(await request.json());
      return respond();
    }),
  );
  return sentBodies;
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    signOutCompletely();
  });

  it('mismatchedPasswords_showErrorWithoutRequest', async () => {
    const sentBodies = mockResetPassword(() => new HttpResponse(null, { status: 204 }));
    renderApp('/reset-password?token=reset-1');
    const user = userEvent.setup();

    await submitNewPassword(user, 'YeniSifre123', 'BaskaSifre123');

    expect(await screen.findByText('Şifreler eşleşmiyor')).toBeInTheDocument();
    expect(sentBodies).toEqual([]);
  });

  it('shortPassword_showsLengthError', async () => {
    mockResetPassword(() => new HttpResponse(null, { status: 204 }));
    renderApp('/reset-password?token=reset-1');
    const user = userEvent.setup();

    await submitNewPassword(user, 'kisa');

    expect(await screen.findByText('Şifre en az 8 karakter olmalıdır')).toBeInTheDocument();
  });

  it('noContent_clearsSessionAndGoesToLogin', async () => {
    signInAs(1);
    const sentBodies = mockResetPassword(() => new HttpResponse(null, { status: 204 }));
    const { router } = renderApp('/reset-password?token=reset-1');
    const user = userEvent.setup();
    await waitFor(() => expect(currentPath(router)).toBe('/reset-password'));

    await submitNewPassword(user, 'YeniSifre123');

    await waitFor(() => expect(currentPath(router)).toBe('/giris'));
    expect(await screen.findByText('Şifren değişti, yeni şifrenle giriş yap')).toBeInTheDocument();
    expect(sentBodies).toEqual([{ token: 'reset-1', newPassword: 'YeniSifre123' }]);
    expect(useAuthStore.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
    expect(readRefreshToken()).toBeNull();
  });

  it('passwordRejected_showsErrorOnFieldAndKeepsForm', async () => {
    mockResetPassword(() =>
      HttpResponse.json(
        buildErrorResponse(400, 'Doğrulama hatası', {
          newPassword: 'Şifre 8-64 karakter olmalıdır',
        }),
        { status: 400 },
      ),
    );
    renderApp('/reset-password?token=reset-1');
    const user = userEvent.setup();

    await submitNewPassword(user, 'YeniSifre123');

    expect(await screen.findByText('Şifre 8-64 karakter olmalıdır')).toBeInTheDocument();
    expect(screen.getByLabelText('Yeni şifre')).toHaveAttribute('aria-invalid', 'true');
  });

  it('deadLink_replacesFormWithNewLinkButton', async () => {
    mockResetPassword(() =>
      HttpResponse.json(buildErrorResponse(400, DEAD_LINK_MESSAGE), { status: 400 }),
    );
    renderApp('/reset-password?token=used');
    const user = userEvent.setup();

    await submitNewPassword(user, 'YeniSifre123');

    expect(await screen.findByText(DEAD_LINK_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Yeni link iste' })).toHaveAttribute(
      'href',
      '/sifremi-unuttum',
    );
    expect(screen.queryByLabelText('Yeni şifre')).not.toBeInTheDocument();
  });

  it('missingToken_showsNewLinkButtonWithoutForm', async () => {
    renderApp('/reset-password');

    expect(await screen.findByRole('link', { name: 'Yeni link iste' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Yeni şifre')).not.toBeInTheDocument();
  });
});
