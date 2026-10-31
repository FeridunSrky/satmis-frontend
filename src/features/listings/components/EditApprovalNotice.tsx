import { Notice } from '@/shared/components/Notice';
import { isPublishedForReview } from '../approval';
import type { ListingDetail } from '../types';
import { RejectionReason } from './ApprovalStatusNotice';

interface EditApprovalNoticeProps {
  listing: Pick<ListingDetail, 'status' | 'rejectionReason'>;
}

/** Warns before saving that the edit may take the listing back into admin review. */
export function EditApprovalNotice({ listing }: EditApprovalNoticeProps) {
  if (isPublishedForReview(listing.status)) {
    return (
      <Notice className="mt-6">
        Başlık, açıklama, fiyat veya fotoğraf değişikliği ilanı yeniden onaya gönderir; onaylanana
        kadar ilan yayında görünmez.
      </Notice>
    );
  }
  if (listing.status === 'REJECTED') {
    return (
      <Notice tone="danger" title="İlanınız yayına alınmadı." className="mt-6">
        <RejectionReason reason={listing.rejectionReason} />
        <p className="mt-2">Kaydettiğinizde ilan tekrar onaya gönderilir.</p>
      </Notice>
    );
  }
  return null;
}
