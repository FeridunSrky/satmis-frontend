import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { useAuthStore } from './authStore';

// Separate file so the memoised bootstrap runs again with an empty storage
describe('bootstrapSession without a stored token', () => {
  it('appStart_noRefreshToken_becomesAnonymousWithoutCallingBackend', async () => {
    // MSW is set to fail on unhandled requests, so any refresh call would fail this test
    renderApp('/', { strictMode: true });

    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'));
    expect(await screen.findByRole('link', { name: 'Kayıt ol' })).toBeInTheDocument();
  });
});
