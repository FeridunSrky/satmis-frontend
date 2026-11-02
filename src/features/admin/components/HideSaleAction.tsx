import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useAdminActionErrorHandler } from '../adminErrors';
import { HIDE_SALE_CONFIRM } from '../confirmations';
import { useHideSoldVehicle } from '../hooks/useAdminListings';

interface HideSaleActionProps {
  listingId: number;
  onHidden?: () => void;
}

/** Against made-up sale prices: removes the sale from the public page, the listing stays sold. */
export function HideSaleAction({ listingId, onHidden }: HideSaleActionProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const hideSale = useHideSoldVehicle();
  const handleError = useAdminActionErrorHandler();

  const hide = async () => {
    try {
      await hideSale.mutateAsync(listingId);
      toast.success('Satış satılmış araçlar sayfasından kaldırıldı');
      onHidden?.();
    } catch (error) {
      handleError(error);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <Button variant="danger" disabled={hideSale.isPending} onClick={() => setIsConfirmOpen(true)}>
        Satışı gizle
      </Button>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        {...HIDE_SALE_CONFIRM}
        isConfirming={hideSale.isPending}
        onConfirm={() => void hide()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
