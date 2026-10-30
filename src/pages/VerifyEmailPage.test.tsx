import { screen, waitFor, within } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildErrorResponse, testUser, unverifiedUser } from '@/test/fixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const INVALID_LINK_MESSAGE = 'Doğrulama linki geçersiz veya süresi dolmuş, yeni bir link isteyin';

function mockVerifyEmail(respond: () => Response) {
  const sentTokens: unknown[] = [];
  server.use(
    mockHttp.post(apiUrl('/auth/verify-email'), async ({ request }) => {
      const body = (await request.json()) as { token?: unknown };
      sentTokens.push(body.token);
      return respond();
    }),
  );
  return sentTokens;
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    signOutCompletely();
  });

  it('validToken_verifiesOnceEvenInStrictModeAndRemovesTokenFromUrl', async () => {
    const sentTokens = mockVerifyEmail(() => new HttpResponse(null, { status: 204 }));
    const { router } = renderApp('/verify-email?token=abc123', { strictMode: true });

    expect(await screen.findByText('E-posta adresin doğrulandı')).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Giriş yap' }),
    ).toHaveAttribute('href', '/giris');
    expect(sentTokens).toEqual(['abc123']);
    expect(currentPath(router)).toBe('/verify-email');
  });

  it('invalidToken_showsBackendMessageAndLoginHint', async () => {
    mockVerifyEmail(() =>
      HttpResponse.json(buildErrorResponse(400, INVALID_LINK_MESSAGE), { status: 400 }),
    );
    renderApp('/verify-email?token=used-token');

    expect(await screen.findByText(INVALID_LINK_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(/Giriş yapıp yeni link iste/)).toBeInTheDocument();
  });

  it('missingToken_showsInvalidLinkWithoutRequest', async () => {
    const sentTokens = mockVerifyEmail(() => new HttpResponse(null, { status: 204 }));
    renderApp('/verify-email');

    expect(await screen.findByRole('heading', { name: 'Link geçersiz' })).toBeInTheDocument();
    expect(sentTokens).toEqual([]);
  });

  it('signedInUnverifiedUser_success_reloadsUserAndHidesBanner', async () => {
    signInAs(1, unverifiedUser);
    mockVerifyEmail(() => new HttpResponse(null, { status: 204 }));
    server.use(mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)));
    renderApp('/verify-email?token=abc123');

    expect(await screen.findByText('E-posta adresin doğrulandı')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'İlan ver' })).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByText('E-posta adresini doğrula.')).not.toBeInTheDocument(),
    );
  });

  it('signedInUser_invalidToken_offersNewLink', async () => {
    signInAs(1, unverifiedUser);
    mockVerifyEmail(() =>
      HttpResponse.json(buildErrorResponse(400, INVALID_LINK_MESSAGE), { status: 400 }),
    );
    renderApp('/verify-email?token=expired');

    expect(await screen.findByRole('button', { name: 'Yeni link gönder' })).toBeInTheDocument();
  });
});
