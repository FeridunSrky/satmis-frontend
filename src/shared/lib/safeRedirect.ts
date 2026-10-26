const DEFAULT_REDIRECT = '/';
const FIRST_PRINTABLE_CHAR_CODE = 0x20;
const DELETE_CHAR_CODE = 0x7f;

/**
 * Only same-origin paths are allowed, so `?next=` cannot be abused as an open redirect
 * (e.g. `//evil.com`, `/\evil.com` or `https://evil.com`).
 */
export function getSafeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || containsControlCharacter(next)) {
    return DEFAULT_REDIRECT;
  }
  const secondCharacter = next.charAt(1);
  if (secondCharacter === '/' || secondCharacter === '\\') {
    return DEFAULT_REDIRECT;
  }
  return next;
}

export function buildLoginPath(currentPath: string): string {
  return `/giris?next=${encodeURIComponent(currentPath)}`;
}

// Browsers strip tabs and newlines from URLs, so "/<TAB>/evil.com" would become "//evil.com"
function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const charCode = character.charCodeAt(0);
    return charCode < FIRST_PRINTABLE_CHAR_CODE || charCode === DELETE_CHAR_CODE;
  });
}
