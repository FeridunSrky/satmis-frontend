import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState, type FormEvent } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmailVerificationAlert } from '@/features/auth/components/EmailVerificationAlert';
import {
  EMAIL_NOT_VERIFIED_CODE,
  IMAGE_NOT_AVAILABLE_CODE,
  PHONE_REQUIRED_CODE,
  toApiError,
} from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { useListingImages, type ExistingImage } from '../hooks/useListingImages';
import type { ListingRequest } from '../types';
import { LISTING_FORM_FIELDS, toListingRequest } from './listingFormMapping';
import { listingFormSchema, type ListingFormInput } from './listingFormSchema';
import { ListingImagesSection } from './ListingImagesSection';
import { ListingInfoSection } from './ListingInfoSection';
import { LocationSection } from './LocationSection';
import { StaleVersionAlert } from './StaleVersionAlert';
import { VehicleSection } from './VehicleSection';

const HTTP_CONFLICT = 409;
const REUPLOAD_HINT = 'Görselleri yeniden yükleyin.';

interface ListingFormProps {
  defaultValues: ListingFormInput;
  /** Edit mode: the listing's current images in display order. */
  initialImages?: ExistingImage[];
  submitLabel: string;
  onSubmit: (request: ListingRequest) => Promise<unknown>;
  /** Edit mode only: reloads the listing after a 409 version conflict. */
  onReloadLatest?: () => Promise<unknown>;
}

export function ListingForm({
  defaultValues,
  initialImages,
  submitLabel,
  onSubmit,
  onReloadLatest,
}: ListingFormProps) {
  const images = useListingImages(initialImages);
  const submitBlockedId = useId();
  const [hasVersionConflict, setHasVersionConflict] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(listingFormSchema), defaultValues });
  const {
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const submit = handleSubmit(async (values) => {
    setHasVersionConflict(false);
    setNeedsEmailVerification(false);
    try {
      await onSubmit(toListingRequest(values));
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'http' && apiError.status === HTTP_CONFLICT && onReloadLatest) {
        setHasVersionConflict(true);
        return;
      }
      if (apiError.kind === 'http' && apiError.code === EMAIL_NOT_VERIFIED_CODE) {
        setNeedsEmailVerification(true);
        return;
      }
      // Only accounts created before phones became mandatory can hit this
      if (apiError.kind === 'http' && apiError.code === PHONE_REQUIRED_CODE) {
        toast.error(apiError.message);
        navigate('/profil');
        return;
      }
      // The form outlived its uploads (they expire after 24 h); the other fields stay as typed
      if (apiError.kind === 'http' && apiError.code === IMAGE_NOT_AVAILABLE_CODE) {
        setError('imageIds', { message: `${apiError.message} ${REUPLOAD_HINT}` });
        return;
      }
      // 400 lands on fields; 403, 404 and 422 carry a message meant for the whole form
      applyServerErrors(apiError, setError, { formFields: LISTING_FORM_FIELDS });
    }
  });

  // The uploader owns the image list; copying it in right before validation avoids a sync effect
  const submitWithImages = (event: FormEvent<HTMLFormElement>) => {
    setValue('imageIds', images.imageIds);
    return submit(event);
  };
  const submitBlockedReason = describeSubmitBlock(images);

  return (
    <FormProvider {...form}>
      <form onSubmit={submitWithImages} noValidate className="flex flex-col gap-6">
        {hasVersionConflict && onReloadLatest && <StaleVersionAlert onReload={onReloadLatest} />}
        {needsEmailVerification && <EmailVerificationAlert />}
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
            disabled={isSubmitting || submitBlockedReason !== undefined}
            aria-describedby={submitBlockedReason ? submitBlockedId : undefined}
          >
            {isSubmitting ? 'Gönderiliyor...' : submitLabel}
          </Button>
          {submitBlockedReason && (
            <p id={submitBlockedId} className="text-sm text-muted">
              {submitBlockedReason}
            </p>
          )}
        </div>
      </form>
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
