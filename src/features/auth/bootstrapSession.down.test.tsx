import { screen, waitFor } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildErrorResponse } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from './authStore';
import { SERVER_UNAVAILABLE_MESSAGE } from './bootstrapSession';

// Separate file so the memoised bootstrap runs again, this time with the backend staying down
describe('bootstrapSession while the backend stays down', () => {
  it('appStart_refreshKeepsFailing_givesUpAfterTwoRetriesAndSaysTheSessionWasKept', async () => {
    let refreshCalls = 0;
    server.use(
      mockHttp.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json(buildErrorResponse(503, 'Hizmet dışı'), { status: 503 });
      }),
    );

    renderApp('/');

    expect(await screen.findByText(SERVER_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
    expect(refreshCalls).toBe(3);
  });
});
