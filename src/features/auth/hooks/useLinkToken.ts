import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { linkTokenSchema } from '../schemas';

const TOKEN_PARAM = 'token';

/**
 * Reads `?token=` from an e-mail link once, then strips it from the URL so the token does not
 * linger in the browser history or on a shared screen. Returns null for a missing/empty token.
 */
export function useLinkToken(): string | null {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token] = useState(() => {
    const parsedToken = linkTokenSchema.safeParse(searchParams.get(TOKEN_PARAM));
    return parsedToken.success ? parsedToken.data : null;
  });
  const isTokenInUrl = searchParams.has(TOKEN_PARAM);

  useEffect(() => {
    if (!isTokenInUrl) {
      return;
    }
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.delete(TOKEN_PARAM);
        return nextParams;
      },
      { replace: true },
    );
  }, [isTokenInUrl, setSearchParams]);

  return token;
}
