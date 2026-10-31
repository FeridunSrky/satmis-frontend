import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import type { ListingDetail } from '../types';
import { ListingGallery } from './ListingGallery';
import { ListingSpecs } from './ListingSpecs';

interface ListingDetailLayoutProps {
  listing: ListingDetail;
  /** The public page shows price and contact here; the admin review shows its decisions. */
  aside: ReactNode;
  className?: string;
}

// One panel in the DOM: under the photos on small screens, a sticky sidebar on large ones
export function ListingDetailLayout({ listing, aside, className }: ListingDetailLayoutProps) {
  return (
    <div className={cn('grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start', className)}>
      <div className="min-w-0 lg:col-start-1">
        <ListingGallery images={listing.images} title={listing.title} />
      </div>
      <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-stretch">{aside}</div>
      {listing.description && (
        <section aria-labelledby="description-title" className="min-w-0 lg:col-start-1">
          <h2 id="description-title" className="font-display text-2xl font-bold">
            Açıklama
          </h2>
          <p className="mt-3 whitespace-pre-line text-ink/90">{listing.description}</p>
        </section>
      )}
      <section aria-labelledby="specs-title" className="min-w-0 lg:col-start-1">
        <h2 id="specs-title" className="mb-3 font-display text-2xl font-bold">
          Araç bilgileri
        </h2>
        <ListingSpecs vehicle={listing.vehicle} />
      </section>
    </div>
  );
}
