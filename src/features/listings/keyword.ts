/** Backend limit for `q`; a longer keyword is answered with 400. */
export const MAX_KEYWORD_LENGTH = 100;

/**
 * Trims the keyword and turns a blank one into `undefined` so it is left out of the request.
 * Case and Turkish letters are left alone: the backend matches them itself.
 */
export function normalizeKeyword(keyword: string | undefined): string | undefined {
  const trimmed = keyword?.trim();
  return trimmed || undefined;
}
