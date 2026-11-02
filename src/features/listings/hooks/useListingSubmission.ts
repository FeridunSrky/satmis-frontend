import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  EMAIL_NOT_VERIFIED_CODE,
  IMAGE_NOT_AVAILABLE_CODE,
  PHONE_REQUIRED_CODE,
  toApiError,
} from '@/shared/api/apiError';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { LISTING_FORM_FIELDS } from '../form/listingFormMapping';
import type { ListingFormInput } from '../form/listingFormSchema';
import type { ListingRequest } from '../types';

const HTTP_CONFLICT = 409;
const REUPLOAD_HINT = 'Görselleri yeniden yükleyin.';

interface ListingSubmissionOptions {
  onSubmit: (request: ListingRequest) => Promise<unknown>;
  /** Edit mode only: a 409 then means the listing changed meanwhile. */
  canReload: boolean;
  setError: UseFormSetError<ListingFormInput>;
}

/** Sends a confirmed listing request and turns each failure into the right form feedback. */
export function useListingSubmission({ onSubmit, canReload, setError }: ListingSubmissionOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasVersionConflict, setHasVersionConflict] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const navigate = useNavigate();

  const handleError = (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.kind === 'http' && apiError.status === HTTP_CONFLICT && canReload) {
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
      void navigate('/profil');
      return;
    }
    // The form outlived its uploads (they expire after 24 h); the other fields stay as typed
    if (apiError.kind === 'http' && apiError.code === IMAGE_NOT_AVAILABLE_CODE) {
      setError('imageIds', { message: `${apiError.message} ${REUPLOAD_HINT}` });
      return;
    }
    // 400 lands on fields; 403, 404 and 422 carry a message meant for the whole form
    applyServerErrors(apiError, setError, { formFields: LISTING_FORM_FIELDS });
  };

  const save = async (request: ListingRequest) => {
    setHasVersionConflict(false);
    setNeedsEmailVerification(false);
    setIsSaving(true);
    try {
      await onSubmit(request);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving, hasVersionConflict, needsEmailVerification };
}
