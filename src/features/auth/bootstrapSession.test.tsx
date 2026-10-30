import { screen } from '@testing-library/react';
import { delay, http as mockHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { buildAuthResponse, testUser } from '@/test/fixtures';
import { currentPath, renderApp } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from './authStore';
import { LEGACY_REFRESH_TOKEN_STORAGE_KEY } from './tokenStorage';

// Kept in its own file: bootstrapSession is memoised per module instance by design
describe('bootstrapSession with a refresh cookie', () => {
  it('appStart_inStrictMode_refreshesOnceWithoutBodyAndWaitsBeforeGuarding', async () => {
    const refreshBodies: string[] = [];
    server.use(
      mockHttp.post(apiUrl('/auth/refresh'), async ({ request }) => {
        refreshBodies.push(await request.text());
        await delay(50);
        return HttpResponse.json(buildAuthResponse(2));
      }),
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
    );
    // Left behind by a version that stored the refresh token in web storage
    window.localStorage.setItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY, 'old-local-token');
    window.sessionStorage.setItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY, 'old-session-token');

    const { router } = renderApp('/profil', { strictMode: true });

    expect(await screen.findByText('Yükleniyor...')).toBeInTheDocument();
    expect(currentPath(router)).toBe('/profil');
    expect(await screen.findByRole('heading', { name: 'Ayşe Yılmaz' })).toBeInTheDocument();
    expect(currentPath(router)).toBe('/profil');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-2',
    });
    expect(refreshBodies).toEqual(['']);
    expect(window.localStorage.getItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
