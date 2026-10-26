import { screen, waitFor } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildErrorResponse, testUser } from '@/test/fixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from '../authStore';

describe('route guards', () => {
  it('protectedRoute_anonymousUser_redirectsToLoginWithNext', async () => {
    signOutCompletely();
    const { router } = renderApp('/profil');

    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(currentPath(router)).toBe('/giris?next=%2Fprofil');
  });

  it('protectedRoute_whileBootstrapping_showsLoaderWithoutRedirecting', async () => {
    // Bootstrap is memoised and already settled in this file, so the status stays put
    useAuthStore.setState({ status: 'bootstrapping' });
    const { router } = renderApp('/profil');

    await waitFor(() => expect(screen.getByText('Yükleniyor...')).toBeInTheDocument());
    expect(currentPath(router)).toBe('/profil');
    expect(screen.queryByRole('heading', { name: 'Giriş yap' })).not.toBeInTheDocument();
  });

  it('guestRoute_authenticatedUser_redirectsHome', async () => {
    signInAs(1);
    const { router } = renderApp('/giris');

    await waitFor(() => expect(currentPath(router)).toBe('/'));
  });

  it('protectedRoute_sessionRejectedByBackend_endsOnLoginPage', async () => {
    signInAs(1);
    server.use(
      mockHttp.get(apiUrl('/users/me'), () =>
        HttpResponse.json(buildErrorResponse(401, 'Yetkisiz'), { status: 401 }),
      ),
      mockHttp.post(apiUrl('/auth/refresh'), () =>
        HttpResponse.json(buildErrorResponse(401, 'Oturum geçersiz'), { status: 401 }),
      ),
    );
    const { router } = renderApp('/profil');

    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(currentPath(router)).toBe('/giris?next=%2Fprofil');
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(screen.queryByText(testUser.email)).not.toBeInTheDocument();
  });
});
