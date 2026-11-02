import { SaleFacts } from '@/features/listings/sale/SaleFacts';
import type { ListingDetail } from '@/features/listings/types';
import { HideSaleAction } from './HideSaleAction';

interface AdminSaleSectionProps {
  listing: Pick<ListingDetail, 'id' | 'price' | 'currency' | 'sale'>;
}

/** A sold listing under review: its recorded sale, and hiding it unless that already happened. */
export function AdminSaleSection({ listing }: AdminSaleSectionProps) {
  const { sale } = listing;
  if (!sale) {
    return null;
  }
  return (
    <section aria-labelledby="admin-sale-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="admin-sale-title" className="font-semibold">
          Satış bilgisi
        </h2>
        {sale.hidden && (
          <span className="inline-flex items-center rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
            Gizlendi
          </span>
        )}
      </div>
      <SaleFacts
        salePrice={sale.salePrice}
        listingPrice={listing.price}
        currency={listing.currency}
        soldAt={sale.soldAt}
        note={sale.note}
      />
      {!sale.hidden && <HideSaleAction listingId={listing.id} />}
    </section>
  );
}
