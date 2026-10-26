const NUMERIC_ID = /^[1-9]\d{0,15}$/;

/** Route `:id` → listing id; anything that is not a positive integer is treated as not found. */
export function parseListingId(rawId: string | undefined): number | null {
  if (!rawId || !NUMERIC_ID.test(rawId)) {
    return null;
  }
  const listingId = Number(rawId);
  return Number.isSafeInteger(listingId) ? listingId : null;
}
