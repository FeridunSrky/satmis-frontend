import { useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import { adminKeys } from '@/features/admin/adminKeys';
import { AdminListingReview } from '@/features/admin/components/AdminListingReview';
import { ListingReportsList } from '@/features/admin/components/ListingReportsList';
import { ReportActions } from '@/features/admin/components/ReportActions';
import { useListingReports } from '@/features/admin/hooks/useAdminReports';
import { parseListingId } from '@/features/listings/listingId';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';

const REPORTS_PATH = '/admin/sikayetler';
const FIRST_PAGE = 1;

export function AdminReportReviewPage() {
  const listingId = parseListingId(useParams().listingId);
  const [searchParams] = useSearchParams();
  const page = parsePageParam(searchParams);
  const queryClient = useQueryClient();
  // Reports come newest first and a decision closes all open ones, so any open report is on
  // the first page whichever page of the history is being shown
  const firstPage = useListingReports(listingId, FIRST_PAGE);
  const hasOpenReports =
    firstPage.data?.content.some((report) => report.status === 'OPEN') ?? false;

  const reloadReports = () => {
    if (listingId !== null) {
      void queryClient.invalidateQueries({ queryKey: adminKeys.listingReportsAll(listingId) });
    }
  };

  return (
    <AdminListingReview
      listingId={listingId}
      backPath={REPORTS_PATH}
      renderActions={(listing, controls) => (
        <ReportActions
          listing={listing}
          hasOpenReports={hasOpenReports}
          isRefreshing={controls.isRefreshing || firstPage.isFetching}
          onReload={() => {
            controls.onReload();
            reloadReports();
          }}
        />
      )}
    >
      {listingId !== null && (
        <ListingReportsList
          listingId={listingId}
          page={page}
          hrefForPage={(nextPage) =>
            buildPageHref(`${REPORTS_PATH}/${listingId}`, searchParams, nextPage)
          }
        />
      )}
    </AdminListingReview>
  );
}
