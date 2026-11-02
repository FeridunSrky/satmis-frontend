import { useParams } from 'react-router-dom';
import { AdminListingReview } from '@/features/admin/components/AdminListingReview';
import { ReviewActions } from '@/features/admin/components/ReviewActions';
import { parseListingId } from '@/features/listings/listingId';

export function AdminListingReviewPage() {
  const listingId = parseListingId(useParams().id);
  return (
    <AdminListingReview
      listingId={listingId}
      backPath="/admin/ilanlar"
      renderActions={(listing, controls) => <ReviewActions listing={listing} {...controls} />}
    />
  );
}
