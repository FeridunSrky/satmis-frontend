import type { UseQueryResult } from '@tanstack/react-query';
import { useController, useFormContext, type Path } from 'react-hook-form';
import { CatalogSelect } from '@/features/catalog/components/CatalogSelect';
import type { CatalogItem } from '@/shared/api/types';
import type { ListingFormInput } from './listingFormSchema';

interface CatalogFieldProps {
  name: Path<ListingFormInput>;
  label: string;
  query: UseQueryResult<CatalogItem[]>;
  isParentSelected?: boolean;
  parentHint?: string;
  /** Fields that depend on this one and must be cleared when it changes. */
  dependentFields?: ReadonlyArray<Path<ListingFormInput>>;
}

// Controlled so the chosen value survives options that load after the form is filled (edit mode)
export function CatalogField({
  name,
  label,
  query,
  isParentSelected,
  parentHint,
  dependentFields = [],
}: CatalogFieldProps) {
  const { setValue } = useFormContext<ListingFormInput>();
  const {
    field: { value, onChange, ...fieldProps },
    fieldState,
  } = useController<ListingFormInput>({ name });

  return (
    <CatalogSelect
      {...fieldProps}
      label={label}
      query={query}
      placeholder="Seçin"
      isParentSelected={isParentSelected}
      parentHint={parentHint}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => {
        onChange(event.target.value);
        for (const dependentField of dependentFields) {
          setValue(dependentField, '', { shouldDirty: true });
        }
      }}
      error={fieldState.error?.message}
    />
  );
}
