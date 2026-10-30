// Earlier versions kept the refresh token in web storage. It now lives in an httpOnly cookie, so
// all that is left to do here is remove what those versions may have left in the browser.
export const LEGACY_REFRESH_TOKEN_STORAGE_KEY = 'satmis.refreshToken';

const webStorages: ReadonlyArray<() => Storage> = [
  () => window.localStorage,
  () => window.sessionStorage,
];

export function removeLegacyTokens(): void {
  for (const getStorage of webStorages) {
    try {
      getStorage().removeItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY);
    } catch (error) {
      // Blocked storage (private mode) cannot hold an old token either; logs the error type only
      const reason = error instanceof Error ? error.name : 'UnknownError';
      console.warn(`Removing legacy session storage failed (${reason}).`);
    }
  }
}
