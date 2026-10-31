import type { CurrencyType } from '@/shared/api/enums';

const LOCALE = 'tr-TR';
const integerFormatter = new Intl.NumberFormat(LOCALE);
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

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

const TURKISH_MOBILE = /^(?:\+90|0)?(5\d{2})(\d{3})(\d{2})(\d{2})$/;

/** "05321234567" or "+905321234567" → "0532 123 45 67"; other numbers are shown as stored. */
export function formatPhone(phone: string): string {
  const match = TURKISH_MOBILE.exec(phone);
  return match ? `0${match.slice(1).join(' ')}` : phone;
}

/** Backend timestamps are UTC ISO strings; Intl renders them in the viewer's local time. */
export function formatDate(isoTimestamp: string): string {
  return dateFormatter.format(new Date(isoTimestamp));
}

export function formatDateTime(isoTimestamp: string): string {
  return dateTimeFormatter.format(new Date(isoTimestamp));
}
