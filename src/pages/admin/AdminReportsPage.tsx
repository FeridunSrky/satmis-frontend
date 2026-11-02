import { Navigate, useSearchParams } from 'react-router-dom';
import { HTTP_FORBIDDEN } from '@/features/admin/adminErrors';
import { ReportSummary } from '@/features/admin/components/ReportSummary';
import { useReportQueue } from '@/features/admin/hooks/useAdminReports';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';
import { hasStatus } from '@/shared/api/apiError';
import { StateMessage } from '@/shared/components/StateMessage';

const REPORTS_PATH = '/admin/sikayetler';

export function AdminReportsPage() {
  const [searchParams] = useSearchParams();
  const page = parsePageParam(searchParams);
  const queueQuery = useReportQueue(page);

  if (hasStatus(queueQuery.error, HTTP_FORBIDDEN)) {
    return <Navigate to="/" replace />;
  }

  return (
    <section aria-labelledby="admin-reports-title">
      <h2 id="admin-reports-title" className="mb-6 font-display text-3xl font-bold">
        Şikayetler
      </h2>
      <ListingResults
        query={queueQuery}
        page={page}
        hrefForPage={(nextPage) => buildPageHref(REPORTS_PATH, searchParams, nextPage)}
        renderCard={(entry) => (
          <div className="flex w-full flex-col gap-2">
            <ListingCard
              listing={entry.listing}
              showStatus
              href={`${REPORTS_PATH}/${entry.listing.id}`}
            />
            <ReportSummary entry={entry} />
          </div>
        )}
        empty={<StateMessage title="İncelenecek şikayet yok." />}
      />
    </section>
  );
}
