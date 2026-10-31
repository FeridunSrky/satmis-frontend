import { z } from 'zod';

export const USER_SEARCH_PARAM = 'q';
/** Backend limit for `q` on GET /api/admin/users. */
export const MAX_USER_SEARCH_LENGTH = 100;

// A hand-edited URL may exceed the limit; cut it instead of letting the request fail
const searchTextSchema = z
  .string()
  .transform((value) => value.slice(0, MAX_USER_SEARCH_LENGTH).trim() || undefined);

export function parseUserSearch(params: URLSearchParams): string | undefined {
  const parsed = searchTextSchema.safeParse(params.get(USER_SEARCH_PARAM) ?? '');
  return parsed.success ? parsed.data : undefined;
}

/** A new search starts on the first page. */
export function toUserSearchParams(searchText: string | undefined): URLSearchParams {
  return searchText
    ? new URLSearchParams({ [USER_SEARCH_PARAM]: searchText })
    : new URLSearchParams();
}
