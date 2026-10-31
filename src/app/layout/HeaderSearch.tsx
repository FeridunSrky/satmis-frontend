import { useMatch, useNavigate } from 'react-router-dom';
import { ListingSearchForm } from '@/features/listings/components/ListingSearchForm';
import { buildListingsHref, LISTINGS_PATH } from '@/features/listings/searchParams';

interface HeaderSearchProps {
  className?: string;
  onSearch?: () => void;
}

/** Search shortcut on every page; a new search starts on the listings page without filters. */
export function HeaderSearch({ className, onSearch }: HeaderSearchProps) {
  const navigate = useNavigate();
  // The listings page has its own search box next to the filters; two boxes would compete
  const isListingsPage = useMatch(LISTINGS_PATH) !== null;
  if (isListingsPage) {
    return null;
  }

  const handleSearch = (keyword: string | undefined) => {
    onSearch?.();
    void navigate(buildListingsHref({ q: keyword, page: 1 }));
  };

  return <ListingSearchForm className={className} onSearch={handleSearch} />;
}
