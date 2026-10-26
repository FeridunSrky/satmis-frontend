import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ListingForm } from '@/features/listings/form/ListingForm';
import { EMPTY_LISTING_FORM } from '@/features/listings/form/listingFormMapping';
import { useCreateListing } from '@/features/listings/hooks/useListingMutations';
import type { ListingRequest } from '@/features/listings/types';

export function CreateListingPage() {
  const createListing = useCreateListing();
  const navigate = useNavigate();

  const handleSubmit = async (request: ListingRequest) => {
    const listing = await createListing.mutateAsync(request);
    toast.success('İlanın yayında');
    navigate(`/ilan/${listing.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">İlan ver</h1>
      <p className="mt-2 text-muted">
        Aracının bilgilerini eksiksiz gir; dolu ilanlar aramalarda daha çok ilgi görür.
      </p>
      <div className="mt-8">
        <ListingForm
          defaultValues={EMPTY_LISTING_FORM}
          submitLabel="İlanı yayınla"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
