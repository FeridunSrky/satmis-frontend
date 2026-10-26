import type { CurrencyType } from '@/shared/api/enums';

const LOCALE = 'tr-TR';
const integerFormatter = new Intl.NumberFormat(LOCALE);
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });

// Whole amounts are shown without ",00" because that is how car prices are usually written
export function formatPrice(amount: number, currency: CurrencyType): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return integerFormatter.format(value);
}

export function formatKilometer(kilometer: number): string {
  return `${integerFormatter.format(kilometer)} km`;
}

/** Backend timestamps are UTC ISO strings; Intl renders them in the viewer's local time. */
export function formatDate(isoTimestamp: string): string {
  return dateFormatter.format(new Date(isoTimestamp));
}
