import { setupServer } from 'msw/node';

// No default handlers: every test declares the backend behaviour it relies on
export const server = setupServer();

/** Matches the request regardless of the jsdom origin axios resolves `/api` against. */
export function apiUrl(path: string): string {
  return `*/api${path}`;
}
