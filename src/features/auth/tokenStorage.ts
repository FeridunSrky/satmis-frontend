// The refresh token lives in localStorage only because the backend currently returns it in the
// response body. Once the backend sets it as an HttpOnly cookie, this module can be removed.
export const REFRESH_TOKEN_STORAGE_KEY = 'satmis.refreshToken';

// localStorage can throw (private mode, blocked storage); the app keeps working in memory
export function readRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (error) {
    warnStorageUnavailable('read', error);
    return null;
  }
}

export function writeRefreshToken(refreshToken: string): void {
  try {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } catch (error) {
    warnStorageUnavailable('write', error);
  }
}

export function removeRefreshToken(): void {
  try {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (error) {
    warnStorageUnavailable('remove', error);
  }
}

// Logs only the error type, never the token value
function warnStorageUnavailable(operation: string, error: unknown): void {
  const reason = error instanceof Error ? error.name : 'UnknownError';
  console.warn(`Session storage ${operation} failed (${reason}); session will not persist.`);
}
