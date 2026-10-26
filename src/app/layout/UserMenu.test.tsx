import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { readRefreshToken } from '@/features/auth/tokenStorage';
import { testUser } from '@/test/fixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

describe('UserMenu', () => {
  it('logout_fromProtectedPage_endsSessionAndGoesHome', async () => {
    const revokedTokens: string[] = [];
    signInAs(1);
    server.use(
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
      mockHttp.post(apiUrl('/auth/logout'), async ({ request }) => {
        const { refreshToken } = (await request.json()) as { refreshToken: string };
        revokedTokens.push(refreshToken);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderApp('/profil');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Ayşe Yılmaz/ }));
    await user.click(screen.getByRole('button', { name: 'Çıkış yap' }));

    await waitFor(() => expect(currentPath(router)).toBe('/'));
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(readRefreshToken()).toBeNull();
    await waitFor(() => expect(revokedTokens).toEqual(['refresh-1']));
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
