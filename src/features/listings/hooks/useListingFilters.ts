import { useSearchParams } from 'react-router-dom';
import {
  applyFilterChange,
  buildPageHref,
  parseListingFilters,
  toSearchParams,
  type FilterPatch,
  type ListingFilters,
} from '../searchParams';

const LISTINGS_PATH = '/ilanlar';

/** Filter state lives in the URL only, so results are shareable and Back works. */
export function useListingFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseListingFilters(searchParams);

  const setFilters = (patch: FilterPatch) => {
    setSearchParams(toSearchParams(applyFilterChange(filters, patch)));
  };
  const clearFilters = () => setSearchParams(new URLSearchParams());

  return {
    filters,
    setFilters,
    clearFilters,
    hrefForFilters: (patch: FilterPatch) => hrefFor(applyFilterChange(filters, patch)),
    hrefForPage: (page: number) => buildPageHref(LISTINGS_PATH, toSearchParams(filters), page),
  };
}

function hrefFor(filters: ListingFilters): string {
  const query = toSearchParams(filters).toString();
  return query ? `${LISTINGS_PATH}?${query}` : LISTINGS_PATH;
}
