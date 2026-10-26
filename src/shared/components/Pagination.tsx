import { Link } from 'react-router-dom';
import { buttonClassName } from './buttonStyles';

interface PaginationProps {
  /** One-based, as shown in the URL. */
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

const disabledClassName = 'pointer-events-none opacity-40';

// Plain links rather than buttons, so pages are shareable and the back button works
export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Sayfalar" className="mt-8 flex items-center justify-between gap-3">
      <Link
        to={hrefForPage(page - 1)}
        aria-disabled={!hasPrevious}
        tabIndex={hasPrevious ? undefined : -1}
        className={`${buttonClassName({ variant: 'secondary' })} ${hasPrevious ? '' : disabledClassName}`}
      >
        Önceki
      </Link>
      <p className="text-sm font-semibold text-muted">
        Sayfa {page} / {totalPages}
      </p>
      <Link
        to={hrefForPage(page + 1)}
        aria-disabled={!hasNext}
        tabIndex={hasNext ? undefined : -1}
        className={`${buttonClassName({ variant: 'secondary' })} ${hasNext ? '' : disabledClassName}`}
      >
        Sonraki
      </Link>
    </nav>
  );
}
