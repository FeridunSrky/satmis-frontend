import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState, type FormEvent } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { EmailVerificationAlert } from '@/features/auth/components/EmailVerificationAlert';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog, type ConfirmCopy } from '@/shared/components/ConfirmDialog';
import { FormAlert } from '@/shared/components/FormAlert';
import { useListingImages, type ExistingImage } from '../hooks/useListingImages';
import { useListingSubmission } from '../hooks/useListingSubmission';
import type { ListingRequest } from '../types';
import { toListingRequest } from './listingFormMapping';
import { listingFormSchema, type ListingFormInput } from './listingFormSchema';
import { ListingImagesSection } from './ListingImagesSection';
import { ListingInfoSection } from './ListingInfoSection';
import { LocationSection } from './LocationSection';
import { StaleVersionAlert } from './StaleVersionAlert';
import { VehicleSection } from './VehicleSection';

interface ListingFormProps {
  defaultValues: ListingFormInput;
  /** Edit mode: the listing's current images in display order. */
  initialImages?: ExistingImage[];
  submitLabel: string;
  /** The question asked after validation passes; nothing is sent until it is confirmed. */
  confirmCopy: (request: ListingRequest) => ConfirmCopy;
  onSubmit: (request: ListingRequest) => Promise<unknown>;
  /** Edit mode only: reloads the listing after a 409 version conflict. */
  onReloadLatest?: () => Promise<unknown>;
}

export function ListingForm({
  defaultValues,
  initialImages,
  submitLabel,
  confirmCopy,
  onSubmit,
  onReloadLatest,
}: ListingFormProps) {
  const images = useListingImages(initialImages);
  const submitBlockedId = useId();
  const [pendingRequest, setPendingRequest] = useState<ListingRequest | null>(null);
  const form = useForm({ resolver: zodResolver(listingFormSchema), defaultValues });
  const {
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = form;
  const submission = useListingSubmission({
    onSubmit,
    canReload: onReloadLatest !== undefined,
    setError,
  });

  // Validation only opens the dialog; disabling the button meanwhile would drop its focus
  const submit = handleSubmit((values) => setPendingRequest(toListingRequest(values)));

  const confirmPending = async () => {
    if (pendingRequest) {
      await submission.save(pendingRequest);
      setPendingRequest(null);
    }
  };

  // The uploader owns the image list; copying it in right before validation avoids a sync effect
  const submitWithImages = (event: FormEvent<HTMLFormElement>) => {
    setValue('imageIds', images.imageIds);
    return submit(event);
  };
  const submitBlockedReason = describeSubmitBlock(images);

  return (
    <FormProvider {...form}>
      <form onSubmit={submitWithImages} noValidate className="flex flex-col gap-6">
        {submission.hasVersionConflict && onReloadLatest && (
          <StaleVersionAlert onReload={onReloadLatest} />
        )}
        {submission.needsEmailVerification && <EmailVerificationAlert />}
        <FormAlert message={errors.root?.server?.message} />
        <ListingInfoSection />
        <VehicleSection />
        <LocationSection />
        <ListingImagesSection images={images} error={errors.imageIds?.message} />
        {Object.keys(errors).length > 0 && !errors.root && (
          <p role="alert" className="text-sm font-medium text-danger">
            Formda düzeltilmesi gereken alanlar var.
          </p>
        )}
        <div className="flex flex-col items-end gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={submission.isSaving || submitBlockedReason !== undefined}
            aria-describedby={submitBlockedReason ? submitBlockedId : undefined}
          >
            {submission.isSaving ? 'Gönderiliyor...' : submitLabel}
          </Button>
          {submitBlockedReason && (
            <p id={submitBlockedId} className="text-sm text-muted">
              {submitBlockedReason}
            </p>
          )}
        </div>
      </form>
      {pendingRequest && (
        <ConfirmDialog
          isOpen
          {...confirmCopy(pendingRequest)}
          isConfirming={submission.isSaving}
          onConfirm={() => void confirmPending()}
          onCancel={() => setPendingRequest(null)}
        />
      )}
    </FormProvider>
  );
}

function describeSubmitBlock({
  isUploading,
  hasFailedImages,
}: Pick<ReturnType<typeof useListingImages>, 'isUploading' | 'hasFailedImages'>) {
  if (isUploading) {
    return 'Görseller yükleniyor; bitince kaydedebilirsiniz.';
  }
  if (hasFailedImages) {
    return 'Yüklenemeyen görselleri kaldırın veya tekrar deneyin.';
  }
  return undefined;
}
