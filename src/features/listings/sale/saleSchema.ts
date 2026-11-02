import { z } from 'zod';
import type { CurrencyType } from '@/shared/api/enums';
import { formatPrice } from '@/shared/lib/format';
import { priceSchema } from '../form/listingFormSchema';
import { isWithinRange, salePriceRange, type SalePriceRange } from './salePrice';

export const MAX_SALE_NOTE_LENGTH = 1000;

export function formatSaleRange(range: SalePriceRange, currency: CurrencyType): string {
  return `${formatPrice(range.min, currency)} – ${formatPrice(range.max, currency)}`;
}

/** The range check mirrors the backend so most mistakes are caught before sending. */
export function buildSaleSchema(listingPrice: number, currency: CurrencyType) {
  const range = salePriceRange(listingPrice);
  return z.object({
    salePrice: priceSchema
      .transform(Number)
      .refine((salePrice) => isWithinRange(salePrice, range), {
        message: `Satış fiyatı ${formatSaleRange(range, currency)} arasında olmalı`,
      }),
    note: z
      .string()
      .max(MAX_SALE_NOTE_LENGTH, `Açıklama en fazla ${MAX_SALE_NOTE_LENGTH} karakter olabilir`)
      .transform((note) => note.trim() || undefined),
  });
}

export type SaleFormInput = z.input<ReturnType<typeof buildSaleSchema>>;
export type SaleFormOutput = z.output<ReturnType<typeof buildSaleSchema>>;
