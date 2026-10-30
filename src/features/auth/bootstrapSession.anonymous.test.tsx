import { screen, waitFor } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildErrorResponse } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from './authStore';

// Separate file so the memoised bootstrap runs again, this time for a visitor without a cookie
describe('bootstrapSession without a refresh cookie', () => {
  it('appStart_refreshUnauthorized_becomesGuestWithoutShowingAnError', async () => {
    let refreshCalls = 0;
    server.use(
      mockHttp.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json(buildErrorResponse(401, 'Refresh token bulunamadı'), {
          status: 401,
        });
      }),
    );

    renderApp('/', { strictMode: true });

    expect(await screen.findByRole('link', { name: 'Kayıt ol' })).toBeInTheDocument();
    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
    expect(refreshCalls).toBe(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Refresh token bulunamadı')).not.toBeInTheDocument();
  });
});
