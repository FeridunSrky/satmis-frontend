import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router-dom';
import { onTestFinished } from 'vitest';
import { App } from '@/app/App';
import { routes } from '@/app/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { installAuth } from '@/features/auth/installAuth';
import { REFRESH_TOKEN_STORAGE_KEY } from '@/features/auth/tokenStorage';
import { buildAuthResponse } from './fixtures';

interface RenderAppOptions {
  strictMode?: boolean;
}

/** Renders the real route tree and auth wiring, with an in-memory router. */
export function renderApp(initialPath: string, { strictMode = false }: RenderAppOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const uninstallAuth = installAuth({
    queryClient,
    navigate: (path) => void router.navigate(path, { replace: true }),
    getCurrentPath: () => router.state.location.pathname + router.state.location.search,
  });
  onTestFinished(uninstallAuth);

  const app = <App router={router} queryClient={queryClient} />;
  const view = render(strictMode ? <StrictMode>{app}</StrictMode> : app);
  return { ...view, router, queryClient };
}

export function currentPath(router: ReturnType<typeof createMemoryRouter>): string {
  return router.state.location.pathname + router.state.location.search;
}

export function signInAs(generation = 1): void {
  useAuthStore.getState().setSession(buildAuthResponse(generation));
}

export function signOutCompletely(): void {
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
}
