import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toApiError } from '@/shared/api/apiError';
import type { PageResponse } from '@/shared/api/types';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Pagination';
import { StateMessage } from '@/shared/components/StateMessage';
import type { ListingSummary } from '../types';

interface ListingResultsProps {
  query: UseQueryResult<PageResponse<ListingSummary>>;
  /** One-based. */
  page: number;
  hrefForPage: (page: number) => string;
  renderCard: (listing: ListingSummary) => ReactNode;
  empty: ReactNode;
}

/** Loading, error, empty and paginated grid states shared by every listing list. */
export function ListingResults({
  query,
  page,
  hrefForPage,
  renderCard,
  empty,
}: ListingResultsProps) {
  if (query.isPending) {
    return <ListingGridSkeleton />;
  }
  if (query.isError) {
    return (
      <StateMessage
        tone="error"
        title="İlanlar yüklenemedi"
        description={toApiError(query.error).message}
      >
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Tekrar dene
        </Button>
      </StateMessage>
    );
  }
  if (query.data.content.length === 0) {
    return empty;
  }
  return (
    <div aria-busy={query.isFetching}>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {query.data.content.map((listing) => (
          <li key={listing.id} className="flex">
            {renderCard(listing)}
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={query.data.totalPages} hrefForPage={hrefForPage} />
    </div>
  );
}

const SKELETON_CARD_COUNT = 6;

function ListingGridSkeleton() {
  return (
    <div>
      <output className="sr-only">İlanlar yükleniyor...</output>
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <li
            key={index}
            className="animate-pulse overflow-hidden rounded-xl border border-line bg-paper"
          >
            <div className="aspect-[4/3] bg-surface" />
            <div className="space-y-3 p-4">
              <div className="h-6 w-1/2 rounded bg-surface" />
              <div className="h-4 w-full rounded bg-surface" />
              <div className="h-4 w-2/3 rounded bg-surface" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
