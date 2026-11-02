const MIN_PERCENT = 80n;
const MAX_PERCENT = 110n;
const CENTS_PER_UNIT = 100;
const PERCENT_BASE = 100n;

export interface SalePriceRange {
  min: number;
  max: number;
}

/**
 * The backend accepts a sale price between 80 % and 110 % of the listing price, both included,
 * rounded inwards to whole kuruş. Computed on integer kuruş with BigInt, because a 13-digit
 * price times 110 no longer fits in a double without losing kuruş.
 */
export function salePriceRange(listingPrice: number): SalePriceRange {
  const cents = BigInt(Math.round(listingPrice * CENTS_PER_UNIT));
  return {
    min: toUnits(percentOf(cents, MIN_PERCENT, 'up')),
    max: toUnits(percentOf(cents, MAX_PERCENT, 'down')),
  };
}

export function isWithinRange(salePrice: number, range: SalePriceRange): boolean {
  return salePrice >= range.min && salePrice <= range.max;
}

/** "%4 pazarlık" below the listing price, "%3 üzerinde" above it. */
export function describePriceDifference(listingPrice: number, salePrice: number): string {
  if (salePrice === listingPrice) {
    return 'İlan fiyatına satıldı';
  }
  const percent = Math.round((Math.abs(listingPrice - salePrice) / listingPrice) * 100);
  const shown = percent === 0 ? '%1’den az' : `%${percent}`;
  return salePrice < listingPrice ? `${shown} pazarlık` : `İlan fiyatının ${shown} üzerinde`;
}

function percentOf(cents: bigint, percent: bigint, rounding: 'up' | 'down'): bigint {
  const product = cents * percent;
  const quotient = product / PERCENT_BASE;
  const hasRemainder = product % PERCENT_BASE !== 0n;
  return rounding === 'up' && hasRemainder ? quotient + 1n : quotient;
}

function toUnits(cents: bigint): number {
  return Number(cents) / CENTS_PER_UNIT;
}
