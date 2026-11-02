import type { CurrencyType } from '@/shared/api/enums';
import { formatDateTime, formatPrice } from '@/shared/lib/format';
import { describePriceDifference } from './salePrice';

interface SaleFactsProps {
  salePrice: number;
  listingPrice: number;
  currency: CurrencyType;
  /** ISO-8601 UTC; shown in the viewer's local time. */
  soldAt: string;
  note: string | null;
}

/** The sale as recorded; the note is the seller's own text, rendered as plain text. */
export function SaleFacts({ salePrice, listingPrice, currency, soldAt, note }: SaleFactsProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div className="col-span-2">
        <dt className="text-muted">Satış fiyatı</dt>
        <dd className="font-display text-3xl font-bold text-brand-700">
          {formatPrice(salePrice, currency)}
        </dd>
      </div>
      <div>
        <dt className="text-muted">İlan fiyatı</dt>
        <dd className="font-semibold">{formatPrice(listingPrice, currency)}</dd>
      </div>
      <div>
        <dt className="text-muted">Fark</dt>
        <dd className="font-semibold">{describePriceDifference(listingPrice, salePrice)}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-muted">Satış tarihi</dt>
        <dd className="font-semibold">{formatDateTime(soldAt)}</dd>
      </div>
      {note && (
        <div className="col-span-2">
          <dt className="text-muted">Satış açıklaması</dt>
          <dd className="whitespace-pre-line">{note}</dd>
        </div>
      )}
    </dl>
  );
}
