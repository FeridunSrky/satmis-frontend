import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FormDialog } from '@/shared/components/FormDialog';
import { StateMessage } from '@/shared/components/StateMessage';
import { useMarkListingSold } from '../hooks/useListingMutations';
import { useListing } from '../hooks/useListingQueries';
import type { ListingDetail } from '../types';
import { saleConfirm, SALE_PANEL_TITLE, SOLD_MESSAGE } from './saleCopy';
import { applySaleError } from './saleErrors';
import { SaleForm } from './SaleForm';
import { buildSaleSchema, type SaleFormInput, type SaleFormOutput } from './saleSchema';

interface SalePanelProps {
  listingId: number;
  onClose: () => void;
}

/** Loads the full listing first: the sale needs its version, and the panel shows its details. */
export function SalePanel({ listingId, onClose }: SalePanelProps) {
  const listingQuery = useListing(listingId);

  if (listingQuery.data) {
    return (
      <SaleFlow
        listing={listingQuery.data}
        onReload={() => void listingQuery.refetch()}
        onClose={onClose}
      />
    );
  }
  return (
    <FormDialog isOpen title={SALE_PANEL_TITLE} onClose={onClose}>
      {listingQuery.isError ? (
        <StateMessage
          tone="error"
          title="İlan yüklenemedi"
          description={toApiError(listingQuery.error).message}
        >
          <Button variant="secondary" onClick={() => void listingQuery.refetch()}>
            Tekrar dene
          </Button>
        </StateMessage>
      ) : (
        <p className="text-muted">Yükleniyor...</p>
      )}
    </FormDialog>
  );
}

interface SaleFlowProps {
  listing: ListingDetail;
  onReload: () => void;
  onClose: () => void;
}

// The form state lives here, so going to the confirmation and back keeps what was typed
function SaleFlow({ listing, onReload, onClose }: SaleFlowProps) {
  const form = useForm<SaleFormInput, unknown, SaleFormOutput>({
    resolver: zodResolver(buildSaleSchema(listing.price, listing.currency)),
    defaultValues: { salePrice: String(listing.price), note: '' },
  });
  const markSold = useMarkListingSold(listing.id);
  // Set once the form is valid; a non-null value means the confirmation is showing
  const [confirmedValues, setConfirmedValues] = useState<SaleFormOutput | null>(null);

  const confirmSale = async (values: SaleFormOutput) => {
    try {
      await markSold.mutateAsync({ ...values, version: listing.version });
      toast.success(SOLD_MESSAGE);
      onClose();
    } catch (error) {
      setConfirmedValues(null);
      applySaleError(error, form.setError, onReload);
    }
  };

  if (confirmedValues) {
    return (
      <ConfirmDialog
        isOpen
        {...saleConfirm(confirmedValues.salePrice, listing.currency)}
        isConfirming={markSold.isPending}
        onConfirm={() => void confirmSale(confirmedValues)}
        onCancel={() => setConfirmedValues(null)}
      />
    );
  }
  return (
    <FormDialog isOpen title={SALE_PANEL_TITLE} onClose={onClose}>
      <SaleForm
        listing={listing}
        form={form}
        onSubmit={form.handleSubmit(setConfirmedValues)}
        onCancel={onClose}
      />
    </FormDialog>
  );
}
