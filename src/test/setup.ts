import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { server } from './server';

// Pages are lazy-loaded; on a cold run the first import can exceed the default 1 s wait
configure({ asyncUtilTimeout: 3000 });

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
  // jsdom does not implement scrolling; React Router's ScrollRestoration calls it on navigation
  Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true });
});

afterEach(() => {
  // sonner replays undismissed toasts to every new Toaster, so they would leak into the next test
  toast.dismiss();
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();
  useAuthStore.setState({ status: 'bootstrapping', user: null, accessToken: null });
});

afterAll(() => server.close());
