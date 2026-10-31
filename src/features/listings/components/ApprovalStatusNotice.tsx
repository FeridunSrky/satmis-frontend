import { useAuthStore } from '@/features/auth/authStore';
import { ButtonLink } from '@/shared/components/Button';
import { Notice } from '@/shared/components/Notice';
import type { ListingDetail } from '../types';

interface ApprovalStatusNoticeProps {
  listing: Pick<ListingDetail, 'id' | 'status' | 'rejectionReason' | 'seller'>;
}

/** Tells the owner why their listing is not public yet; others never get such a listing. */
export function ApprovalStatusNotice({ listing }: ApprovalStatusNoticeProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  if (currentUserId !== listing.seller.id) {
    return null;
  }

  if (listing.status === 'PENDING_APPROVAL') {
    return (
      <Notice title="Bu ilan onay bekliyor.">Onaylanana kadar sadece siz görebilirsiniz.</Notice>
    );
  }
  if (listing.status === 'REJECTED') {
    return (
      <Notice tone="danger" title="İlanınız yayına alınmadı.">
        <RejectionReason reason={listing.rejectionReason} />
        <ButtonLink to={`/ilan/${listing.id}/duzenle`} variant="secondary" className="mt-3">
          Düzenle
        </ButtonLink>
      </Notice>
    );
  }
  return null;
}

/** The admin's text is rendered as plain text, never as HTML. */
export function RejectionReason({ reason }: { reason: string | null }) {
  if (!reason) {
    return null;
  }
  return (
    <p className="whitespace-pre-line">
      <span className="font-semibold">Red nedeni: </span>
      {reason}
    </p>
  );
}
