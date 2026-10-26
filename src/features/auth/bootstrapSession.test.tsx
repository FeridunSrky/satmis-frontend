import { screen, waitFor } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildAuthResponse } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from './authStore';
import { REFRESH_TOKEN_STORAGE_KEY } from './tokenStorage';

// Kept in its own file: bootstrapSession is memoised per module instance by design
describe('bootstrapSession', () => {
  it('appStart_inStrictMode_callsRefreshExactlyOnce', async () => {
    let refreshCalls = 0;
    server.use(
      mockHttp.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json(buildAuthResponse(2));
      }),
    );
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');

    renderApp('/', { strictMode: true });

    expect(await screen.findByRole('button', { name: /Ayşe Yılmaz/ })).toBeInTheDocument();
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(refreshCalls).toBe(1);
  });
});
