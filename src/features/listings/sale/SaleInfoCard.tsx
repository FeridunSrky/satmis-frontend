import { cn } from '@/shared/lib/cn';
import type { ListingDetail } from '../types';
import { HIDDEN_SALE_WARNING } from './saleCopy';
import { SaleFacts } from './SaleFacts';

interface SaleInfoCardProps {
  listing: Pick<ListingDetail, 'price' | 'currency' | 'sale'>;
  className?: string;
}

/** The recorded sale of a SOLD listing, for its owner and for admins. */
export function SaleInfoCard({ listing, className }: SaleInfoCardProps) {
  const { sale } = listing;
  if (!sale) {
    return null;
  }
  return (
    <section
      aria-labelledby="sale-info-title"
      className={cn('rounded-2xl border border-line bg-paper p-6', className)}
    >
      <h2 id="sale-info-title" className="font-display text-2xl font-bold">
        Satış bilgisi
      </h2>
      {sale.hidden && (
        <p className="mt-3 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {HIDDEN_SALE_WARNING}
        </p>
      )}
      <div className="mt-4">
        <SaleFacts
          salePrice={sale.salePrice}
          listingPrice={listing.price}
          currency={listing.currency}
          soldAt={sale.soldAt}
          note={sale.note}
        />
      </div>
    </section>
  );
}
