import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import type { CatalogItem } from '@/shared/api/types';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FormAlert } from '@/shared/components/FormAlert';
import { TextField } from '@/shared/components/TextField';
import { applyServerErrors } from '@/shared/lib/formServerErrors';
import { HTTP_CONFLICT, HTTP_FORBIDDEN } from '../adminErrors';
import { catalogAddConfirm } from '../confirmations';

const MAX_NAME_LENGTH = 50;
const NAME_FIELDS = ['name'] as const;

const catalogNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'İsim zorunludur')
    .max(MAX_NAME_LENGTH, `İsim en fazla ${MAX_NAME_LENGTH} karakter olabilir`),
});

interface AddCatalogItemFormProps {
  label: string;
  onAdd: (name: string) => Promise<CatalogItem>;
  onAdded?: (item: CatalogItem) => void;
}

export function AddCatalogItemForm({ label, onAdd, onAdded }: AddCatalogItemFormProps) {
  const navigate = useNavigate();
  const [pendingName, setPendingName] = useState<string>();
  const [isAdding, setIsAdding] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(catalogNameSchema), defaultValues: { name: '' } });

  // Validation only opens the dialog; disabling the button meanwhile would drop its focus
  const submit = handleSubmit(({ name }) => setPendingName(name));

  const add = async (name: string) => {
    setIsAdding(true);
    try {
      const item = await onAdd(name);
      reset();
      onAdded?.(item);
    } catch (error) {
      if (hasStatus(error, HTTP_FORBIDDEN)) {
        void navigate('/', { replace: true });
        return;
      }
      // 409 carries no field map but always means the name is taken
      applyServerErrors(toApiError(error), setError, {
        formFields: NAME_FIELDS,
        statusFields: { [HTTP_CONFLICT]: { field: 'name' } },
      });
    } finally {
      setIsAdding(false);
      setPendingName(undefined);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <FormAlert message={errors.root?.server?.message} />
      <div className="flex items-start gap-2">
        <TextField
          label={label}
          className="min-w-0 flex-1"
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
          error={errors.name?.message}
          {...register('name')}
        />
        <Button type="submit" className="mt-7 h-11 shrink-0" disabled={isAdding}>
          Ekle
        </Button>
      </div>
      {pendingName !== undefined && (
        <ConfirmDialog
          isOpen
          {...catalogAddConfirm(pendingName)}
          isConfirming={isAdding}
          onConfirm={() => void add(pendingName)}
          onCancel={() => setPendingName(undefined)}
        />
      )}
    </form>
  );
}
