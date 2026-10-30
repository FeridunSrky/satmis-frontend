import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router-dom';
import { onTestFinished } from 'vitest';
import { App } from '@/app/App';
import { routes } from '@/app/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { installAuth } from '@/features/auth/installAuth';
import type { UserResponse } from '@/shared/api/types';
import { buildAuthResponse, testUser } from './fixtures';

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

export function signInAs(generation = 1, user: UserResponse = testUser): void {
  useAuthStore.getState().setSession(buildAuthResponse(generation, user));
}

export function signOutCompletely(): void {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
}
