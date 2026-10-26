import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { server } from './server';

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
  // jsdom does not implement scrolling; React Router's ScrollRestoration calls it on navigation
  Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();
  useAuthStore.setState({ status: 'bootstrapping', user: null, accessToken: null });
});

afterAll(() => server.close());
