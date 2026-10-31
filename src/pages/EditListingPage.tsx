import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/authStore';
import { updatedMessage } from '@/features/listings/approval';
import { EditApprovalNotice } from '@/features/listings/components/EditApprovalNotice';
import { ListingForm } from '@/features/listings/form/ListingForm';
import { toExistingImages, toListingFormValues } from '@/features/listings/form/listingFormMapping';
import { useListing } from '@/features/listings/hooks/useListingQueries';
import { useUpdateListing } from '@/features/listings/hooks/useListingMutations';
import { parseListingId } from '@/features/listings/listingId';
import { canEditListing } from '@/features/listings/statusTransitions';
import type { ListingRequest } from '@/features/listings/types';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button, ButtonLink } from '@/shared/components/Button';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { StateMessage } from '@/shared/components/StateMessage';

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

export function EditListingPage() {
  const listingId = parseListingId(useParams().id);
  const listingQuery = useListing(listingId);
  const updateListing = useUpdateListing(listingId ?? 0);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const navigate = useNavigate();

  const isNotAccessible =
    hasStatus(listingQuery.error, HTTP_NOT_FOUND) || hasStatus(listingQuery.error, HTTP_FORBIDDEN);
  if (listingId === null || isNotAccessible) {
    return <EditUnavailable />;
  }
  if (listingQuery.isPending) {
    return <FullPageLoader />;
  }
  if (listingQuery.isError) {
    return (
      <PageFrame>
        <StateMessage
          tone="error"
          title="İlan yüklenemedi"
          description={toApiError(listingQuery.error).message}
        >
          <Button variant="secondary" onClick={() => void listingQuery.refetch()}>
            Tekrar dene
          </Button>
        </StateMessage>
      </PageFrame>
    );
  }

  const listing = listingQuery.data;
  // The backend rejects non-owners with 403 anyway; this avoids showing them a form at all
  if (listing.seller.id !== currentUserId) {
    return <EditUnavailable />;
  }
  if (!canEditListing(listing.status)) {
    return (
      <PageFrame>
        <StateMessage
          title="Satılan ilan düzenlenemez"
          description="Satıldı olarak işaretlenen ilanlar son hâlinde kalır."
        >
          <ButtonLink to={`/ilan/${listing.id}`}>İlana dön</ButtonLink>
        </StateMessage>
      </PageFrame>
    );
  }

  const handleSubmit = async (request: ListingRequest) => {
    const updated = await updateListing.mutateAsync({ ...request, version: listing.version });
    toast.success(updatedMessage(listing.status, updated.status));
    navigate(`/ilan/${listing.id}`);
  };

  return (
    <PageFrame>
      <h1 className="font-display text-4xl font-bold sm:text-5xl">İlanı düzenle</h1>
      <p className="mt-2 truncate text-muted">{listing.title}</p>
      <EditApprovalNotice listing={listing} />
      <div className="mt-8">
        {/* A newer version from "Güncel hali yükle" remounts the form with fresh values */}
        <ListingForm
          key={listing.version}
          defaultValues={toListingFormValues(listing)}
          initialImages={toExistingImages(listing)}
          submitLabel="Değişiklikleri kaydet"
          onSubmit={handleSubmit}
          onReloadLatest={() => listingQuery.refetch()}
        />
      </div>
    </PageFrame>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl px-4 py-10">{children}</div>;
}

function EditUnavailable() {
  return (
    <PageFrame>
      <StateMessage
        title="İlan bulunamadı veya düzenleme yetkiniz yok"
        description="Yalnızca kendi ilanlarınızı düzenleyebilirsiniz."
      >
        <ButtonLink to="/ilanlarim">İlanlarıma git</ButtonLink>
      </StateMessage>
    </PageFrame>
  );
}
