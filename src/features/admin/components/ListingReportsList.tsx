import type { ReportStatus } from '@/shared/api/enums';
import { Pagination } from '@/shared/components/Pagination';
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from '@/shared/config/vehicleLabels';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { useListingReports } from '../hooks/useAdminReports';
import type { AdminListingReport } from '../types';
import { AdminQueryError } from './AdminQueryError';

interface ListingReportsListProps {
  listingId: number;
  /** One-based. */
  page: number;
  hrefForPage: (page: number) => string;
}

export function ListingReportsList({ listingId, page, hrefForPage }: ListingReportsListProps) {
  const reportsQuery = useListingReports(listingId, page);
  return (
    <section aria-labelledby="listing-reports-title" className="mt-10">
      <h2 id="listing-reports-title" className="font-display text-2xl font-bold">
        Şikayetler
      </h2>
      <div className="mt-4">
        {reportsQuery.isPending && (
          <output className="block text-muted">Şikayetler yükleniyor...</output>
        )}
        {reportsQuery.isError && (
          <AdminQueryError
            error={reportsQuery.error}
            title="Şikayetler yüklenemedi"
            onRetry={() => void reportsQuery.refetch()}
          />
        )}
        {reportsQuery.isSuccess && reportsQuery.data.content.length === 0 && (
          <p className="text-muted">Bu ilan için şikayet yok.</p>
        )}
        {reportsQuery.isSuccess && reportsQuery.data.content.length > 0 && (
          <div aria-busy={reportsQuery.isFetching}>
            <ul className="flex flex-col gap-3">
              {reportsQuery.data.content.map((report) => (
                <ReportItem key={report.id} report={report} />
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={reportsQuery.data.totalPages}
              hrefForPage={hrefForPage}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ReportItem({ report }: { report: AdminListingReport }) {
  const isOpen = report.status === 'OPEN';
  return (
    <li
      className={cn(
        'rounded-xl border p-4',
        isOpen ? 'border-l-4 border-danger bg-danger-soft/40' : 'border-line bg-paper',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{REPORT_REASON_LABELS[report.reason]}</p>
        <ReportStatusBadge status={report.status} />
      </div>
      {report.description && <p className="mt-2 whitespace-pre-line">{report.description}</p>}
      <p className="mt-2 text-sm text-muted">
        {report.reporter.firstName} {report.reporter.lastName} ({report.reporter.email}) ·{' '}
        {formatDateTime(report.createdAt)}
      </p>
    </li>
  );
}

const statusClassNames: Record<ReportStatus, string> = {
  OPEN: 'bg-danger-soft text-danger',
  DISMISSED: 'bg-surface text-muted',
  ACTION_TAKEN: 'bg-brand-50 text-brand-700',
};

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        statusClassNames[status],
      )}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}
