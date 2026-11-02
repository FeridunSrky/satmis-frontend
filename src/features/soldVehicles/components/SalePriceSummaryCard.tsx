import type { UseQueryResult } from '@tanstack/react-query';
import { formatNumber, formatPrice } from '@/shared/lib/format';
import type { CurrencyPriceSummary, SalePriceSummary } from '../types';

interface SalePriceSummaryCardProps {
  query: UseQueryResult<SalePriceSummary>;
}

/**
 * Sits above the list but never blocks it: while loading, on error or without sales it
 * simply shows nothing, or a one-line note for the error.
 */
export function SalePriceSummaryCard({ query }: SalePriceSummaryCardProps) {
  if (query.isError) {
    return <p className="text-sm text-muted">Fiyat özeti şu an gösterilemiyor.</p>;
  }
  const currencies = query.data?.currencies ?? [];
  if (currencies.length === 0) {
    return null;
  }
  return (
    <section
      aria-label="Fiyat özeti"
      aria-busy={query.isFetching}
      className="rounded-2xl border border-line bg-surface p-5"
    >
      <ul className="flex flex-col gap-2">
        {currencies.map((summary) => (
          <li key={summary.currency}>{describeSummary(summary)}</li>
        ))}
      </ul>
    </section>
  );
}

function describeSummary({ currency, count, average, min, max }: CurrencyPriceSummary): string {
  return [
    `Bu aramada ${formatNumber(count)} araç satıldı`,
    `Ortalama ${formatPrice(average, currency)}`,
    `En düşük ${formatPrice(min, currency)}`,
    `En yüksek ${formatPrice(max, currency)}`,
  ].join(' · ');
}
