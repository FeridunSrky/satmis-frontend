import { useNavigate, useParams } from 'react-router-dom';
import { HideSaleAction } from '@/features/admin/components/HideSaleAction';
import { useAuthStore } from '@/features/auth/authStore';
import { ListingDetailLayout } from '@/features/listings/components/ListingDetailLayout';
import { parseListingId } from '@/features/listings/listingId';
import { SoldVehicleAside } from '@/features/soldVehicles/components/SoldVehicleAside';
import { useSoldVehicle } from '@/features/soldVehicles/hooks/useSoldVehicles';
import { SOLD_VEHICLES_PATH } from '@/features/soldVehicles/soldVehiclePaths';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button, ButtonLink } from '@/shared/components/Button';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { StateMessage } from '@/shared/components/StateMessage';

const HTTP_NOT_FOUND = 404;

export function SoldVehicleDetailPage() {
  const listingId = parseListingId(useParams().id);
  const soldQuery = useSoldVehicle(listingId);
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');
  const navigate = useNavigate();

  if (listingId === null || hasStatus(soldQuery.error, HTTP_NOT_FOUND)) {
    return <SoldVehicleNotFound />;
  }
  if (soldQuery.isPending) {
    return <FullPageLoader />;
  }
  if (soldQuery.isError) {
    return (
      <PageFrame>
        <StateMessage
          tone="error"
          title="Satılmış araç yüklenemedi"
          description={toApiError(soldQuery.error).message}
        >
          <Button variant="secondary" onClick={() => void soldQuery.refetch()}>
            Tekrar dene
          </Button>
        </StateMessage>
      </PageFrame>
    );
  }

  const vehicle = soldQuery.data;
  return (
    <PageFrame>
      <ListingDetailLayout
        listing={vehicle}
        aside={
          <SoldVehicleAside
            vehicle={vehicle}
            actions={
              isAdmin && (
                <HideSaleAction
                  listingId={vehicle.id}
                  onHidden={() => void navigate(SOLD_VEHICLES_PATH, { replace: true })}
                />
              )
            }
          />
        }
      />
    </PageFrame>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>;
}

function SoldVehicleNotFound() {
  return (
    <PageFrame>
      <StateMessage
        title="Satılmış araç bulunamadı"
        description="Satış geri alınmış, kaldırılmış ya da adres yanlış olabilir."
      >
        <ButtonLink to={SOLD_VEHICLES_PATH}>Satılmış araçlara dön</ButtonLink>
      </StateMessage>
    </PageFrame>
  );
}
