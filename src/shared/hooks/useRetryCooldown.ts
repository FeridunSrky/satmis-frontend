import { useEffect, useRef, useState } from 'react';
import { HTTP_TOO_MANY_REQUESTS, type ApiError } from '@/shared/api/apiError';

const MILLISECONDS_PER_SECOND = 1000;

/** Keeps a submit button disabled for as long as a 429 answer's `Retry-After` asks. */
export function useRetryCooldown() {
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const startCooldown = (apiError: ApiError) => {
    if (apiError.kind !== 'http' || apiError.status !== HTTP_TOO_MANY_REQUESTS) {
      return;
    }
    if (!apiError.retryAfterSeconds) {
      return;
    }
    window.clearTimeout(timerRef.current);
    setIsCoolingDown(true);
    timerRef.current = window.setTimeout(
      () => setIsCoolingDown(false),
      apiError.retryAfterSeconds * MILLISECONDS_PER_SECOND,
    );
  };

  return { isCoolingDown, startCooldown };
}
