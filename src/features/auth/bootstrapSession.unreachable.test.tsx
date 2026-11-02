import { screen } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildAuthResponse, buildErrorResponse, testUser } from '@/test/fixtures';
import { currentPath, renderApp } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from './authStore';

// Separate file so the memoised bootstrap runs again, this time while the backend restarts
describe('bootstrapSession while the backend is briefly unreachable', () => {
  it('appStart_refreshGatewayErrorsThenOk_retriesAndKeepsTheUserOnTheProtectedPage', async () => {
    const failedStatuses = [503, 502];
    let refreshCalls = 0;
    server.use(
      mockHttp.post(apiUrl('/auth/refresh'), () => {
        const status = failedStatuses[refreshCalls];
        refreshCalls += 1;
        return status
          ? HttpResponse.json(buildErrorResponse(status, 'Hizmet dışı'), { status })
          : HttpResponse.json(buildAuthResponse(2));
      }),
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
    );

    const { router } = renderApp('/profil');

    expect(await screen.findByRole('heading', { name: 'Ayşe Yılmaz' })).toBeInTheDocument();
    expect(currentPath(router)).toBe('/profil');
    expect(refreshCalls).toBe(3);
    expect(useAuthStore.getState()).toMatchObject({ status: 'authenticated' });
  });
});
