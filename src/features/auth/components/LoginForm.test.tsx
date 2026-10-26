import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildAuthResponse, buildErrorResponse, testUser } from '@/test/fixtures';
import { currentPath, renderApp, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from '../authStore';
import { readRefreshToken } from '../tokenStorage';

const VALID_PASSWORD = 'GizliSifre123';

function mockLogin() {
  server.use(
    mockHttp.post(apiUrl('/auth/login'), async ({ request }) => {
      const { password } = (await request.json()) as { password: string };
      if (password !== VALID_PASSWORD) {
        return HttpResponse.json(buildErrorResponse(401, 'E-posta veya şifre hatalı'), {
          status: 401,
        });
      }
      return HttpResponse.json(buildAuthResponse(1));
    }),
    mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
  );
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  // Pages are lazy-loaded, so wait for the form before interacting
  const submitButton = await screen.findByRole('button', { name: 'Giriş yap' });
  if (email) await user.type(screen.getByLabelText('E-posta'), email);
  if (password) await user.type(screen.getByLabelText('Şifre'), password);
  await user.click(submitButton);
}

describe('LoginForm', () => {
  beforeEach(() => {
    signOutCompletely();
    mockLogin();
  });

  it('submit_emptyFields_showsTurkishValidationMessages', async () => {
    renderApp('/giris');

    await fillAndSubmit('', '');

    expect(await screen.findByText('E-posta adresi zorunludur')).toBeInTheDocument();
    expect(screen.getByText('Şifre zorunludur')).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toHaveAttribute('aria-invalid', 'true');
  });

  it('submit_invalidEmail_showsFormatMessage', async () => {
    renderApp('/giris');

    await fillAndSubmit('ayse@', VALID_PASSWORD);

    expect(await screen.findByText('Geçerli bir e-posta adresi girin')).toBeInTheDocument();
  });

  it('submit_validCredentials_storesSessionAndRedirectsHome', async () => {
    const { router } = renderApp('/giris');

    await fillAndSubmit(testUser.email, VALID_PASSWORD);

    await waitFor(() => expect(currentPath(router)).toBe('/'));
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-1',
      user: testUser,
    });
    expect(readRefreshToken()).toBe('refresh-1');
  });

  it('submit_withNextParam_returnsToRequestedPage', async () => {
    const { router } = renderApp('/giris?next=%2Fprofil');

    await fillAndSubmit(testUser.email, VALID_PASSWORD);

    await waitFor(() => expect(currentPath(router)).toBe('/profil'));
  });

  it('submit_withExternalNextParam_ignoresItAndGoesHome', async () => {
    const { router } = renderApp('/giris?next=%2F%2Fevil.example.com');

    await fillAndSubmit(testUser.email, VALID_PASSWORD);

    await waitFor(() => expect(currentPath(router)).toBe('/'));
  });

  it('submit_wrongPassword_showsCredentialsError', async () => {
    renderApp('/giris');

    await fillAndSubmit(testUser.email, 'YanlisSifre1');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı');
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('submit_serverUnreachable_showsNetworkMessage', async () => {
    server.use(mockHttp.post(apiUrl('/auth/login'), () => HttpResponse.error()));
    renderApp('/giris');

    await fillAndSubmit(testUser.email, VALID_PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sunucuya ulaşılamıyor, lütfen tekrar deneyin',
    );
  });
});
