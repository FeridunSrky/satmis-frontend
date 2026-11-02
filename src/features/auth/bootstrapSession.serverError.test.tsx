import { screen, waitFor } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildErrorResponse } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from './authStore';
import { SERVER_UNAVAILABLE_MESSAGE } from './bootstrapSession';

// Separate file so the memoised bootstrap runs again, this time with a failing backend
describe('bootstrapSession when the backend fails', () => {
  it('appStart_refreshInternalError_isNotRetriedButStillSaysTheSessionWasKept', async () => {
    let refreshCalls = 0;
    server.use(
      mockHttp.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json(buildErrorResponse(500, 'Beklenmeyen hata'), { status: 500 });
      }),
    );

    renderApp('/');

    expect(await screen.findByText(SERVER_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
    // A 500 is a fault in the backend itself, which a retry seconds later rarely fixes
    expect(refreshCalls).toBe(1);
  });
});
