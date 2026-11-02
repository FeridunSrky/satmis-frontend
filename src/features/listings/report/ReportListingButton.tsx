import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/authStore';
import { Button } from '@/shared/components/Button';
import { FormDialog } from '@/shared/components/FormDialog';
import { buildLoginPath } from '@/shared/lib/safeRedirect';
import { ReportListingForm, type ReportOutcome } from './ReportListingForm';

/** Not rendered for the owner; the backend would refuse a self-report with 422. */
export function ReportListingButton({ listingId }: { listingId: number }) {
  const isSignedIn = useAuthStore((state) => state.status === 'authenticated');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  // Remembered for this visit only: the backend offers no list of one's own reports
  const [isReported, setIsReported] = useState(false);

  const open = () => {
    if (!isSignedIn) {
      void navigate(buildLoginPath(`/ilan/${listingId}`));
      return;
    }
    setIsOpen(true);
  };

  const handleDone = (outcome: ReportOutcome) => {
    setIsOpen(false);
    setIsReported(true);
    if (outcome.kind === 'reported') {
      toast.success('Şikayetiniz alındı, incelenecek.');
    } else {
      toast.info(outcome.message);
    }
  };

  return (
    <>
      <Button variant="secondary" disabled={isReported} onClick={open}>
        {isReported ? 'Şikayet edildi' : 'İlanı şikayet et'}
      </Button>
      <FormDialog
        isOpen={isOpen}
        title="İlanı şikayet et"
        description="Şikayetiniz yönetici tarafından incelenir."
        onClose={() => setIsOpen(false)}
      >
        <ReportListingForm
          listingId={listingId}
          onCancel={() => setIsOpen(false)}
          onDone={handleDone}
        />
      </FormDialog>
    </>
  );
}
