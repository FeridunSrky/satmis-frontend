import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { testUser } from '@/test/fixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

describe('UserMenu', () => {
  it('logout_fromProtectedPage_endsSessionAndGoesHome', async () => {
    const logoutBodies: string[] = [];
    signInAs(1);
    server.use(
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
      mockHttp.post(apiUrl('/auth/logout'), async ({ request }) => {
        // The backend revokes the token from the httpOnly cookie, so nothing is sent in the body
        logoutBodies.push(await request.text());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderApp('/profil');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Ayşe Yılmaz/ }));
    await user.click(screen.getByRole('button', { name: 'Çıkış yap' }));

    await waitFor(() => expect(currentPath(router)).toBe('/'));
    expect(useAuthStore.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
    await waitFor(() => expect(logoutBodies).toEqual(['']));
  });

  it('logout_backendUnreachable_stillEndsLocalSession', async () => {
    signInAs(1);
    server.use(mockHttp.post(apiUrl('/auth/logout'), () => HttpResponse.error()));
    renderApp('/');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Ayşe Yılmaz/ }));
    await user.click(screen.getByRole('button', { name: 'Çıkış yap' }));

    expect(await screen.findByRole('link', { name: 'Kayıt ol' })).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});
