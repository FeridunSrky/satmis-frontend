import { useSearchParams } from 'react-router-dom';
import {
  applyFilterChange,
  buildFiltersHref,
  buildPageHref,
  LISTINGS_PATH,
  parseListingFilters,
  toSearchParams,
  type FilterPatch,
} from '../searchParams';

/**
 * Filter state lives in the URL only, so results are shareable and Back works.
 * `pathname` is the page the filters belong to (the listing search or the sold vehicles).
 */
export function useListingFilters(pathname: string = LISTINGS_PATH) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseListingFilters(searchParams);

  const setFilters = (patch: FilterPatch) => {
    setSearchParams(toSearchParams(applyFilterChange(filters, patch)));
  };
  // The filter panel's reset keeps the keyword: the search box is not part of the panel
  const clearFilters = () => setSearchParams(toSearchParams({ q: filters.q, page: 1 }));
  const clearAll = () => setSearchParams(new URLSearchParams());

  return {
    filters,
    setFilters,
    clearFilters,
    clearAll,
    hrefForFilters: (patch: FilterPatch) =>
      buildFiltersHref(pathname, applyFilterChange(filters, patch)),
    hrefForPage: (page: number) => buildPageHref(pathname, toSearchParams(filters), page),
  };
}
