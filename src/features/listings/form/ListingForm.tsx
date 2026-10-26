import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { FormAlert } from '@/shared/components/FormAlert';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import type { ListingRequest } from '../types';
import { ImageUrlsSection } from './ImageUrlsSection';
import { LISTING_FORM_FIELDS, toListingRequest } from './listingFormMapping';
import { listingFormSchema, type ListingFormInput } from './listingFormSchema';
import { ListingInfoSection } from './ListingInfoSection';
import { LocationSection } from './LocationSection';
import { StaleVersionAlert } from './StaleVersionAlert';
import { VehicleSection } from './VehicleSection';

const HTTP_CONFLICT = 409;

interface ListingFormProps {
  defaultValues: ListingFormInput;
  submitLabel: string;
  onSubmit: (request: ListingRequest) => Promise<unknown>;
  /** Edit mode only: reloads the listing after a 409 version conflict. */
  onReloadLatest?: () => Promise<unknown>;
}

export function ListingForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onReloadLatest,
}: ListingFormProps) {
  const [hasVersionConflict, setHasVersionConflict] = useState(false);
  const form = useForm({ resolver: zodResolver(listingFormSchema), defaultValues });
  const {
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const submit = handleSubmit(async (values) => {
    setHasVersionConflict(false);
    try {
      await onSubmit(toListingRequest(values));
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'http' && apiError.status === HTTP_CONFLICT && onReloadLatest) {
        setHasVersionConflict(true);
        return;
      }
      // 400 lands on fields; 403, 404 and 422 carry a message meant for the whole form
      applyServerErrors(apiError, setError, { formFields: LISTING_FORM_FIELDS });
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        {hasVersionConflict && onReloadLatest && <StaleVersionAlert onReload={onReloadLatest} />}
        <FormAlert message={errors.root?.server?.message} />
        <ListingInfoSection />
        <VehicleSection />
        <LocationSection />
        <ImageUrlsSection />
        {Object.keys(errors).length > 0 && !errors.root && (
          <p role="alert" className="text-sm font-medium text-danger">
            Formda düzeltilmesi gereken alanlar var.
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor...' : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
