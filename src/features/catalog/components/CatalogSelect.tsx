import type { UseQueryResult } from '@tanstack/react-query';
import { toApiError } from '@/shared/api/apiError';
import type { CatalogItem } from '@/shared/api/types';
import { SelectField, type SelectFieldProps } from '@/shared/components/SelectField';

interface CatalogSelectProps extends Omit<SelectFieldProps, 'options' | 'placeholder'> {
  query: UseQueryResult<CatalogItem[]>;
  placeholder: string;
  /** Shown while the parent choice (e.g. brand for models) is still empty. */
  parentHint?: string;
  isParentSelected?: boolean;
}

/** A select backed by a catalog query, with its loading, error and "choose parent first" states. */
export function CatalogSelect({
  query,
  placeholder,
  parentHint,
  isParentSelected = true,
  disabled,
  hint,
  ...selectProps
}: CatalogSelectProps) {
  const options = (query.data ?? []).map((item) => ({ value: String(item.id), label: item.name }));
  const stateHint = getStateHint(query, isParentSelected, parentHint);

  return (
    <SelectField
      {...selectProps}
      options={options}
      placeholder={query.isLoading ? 'Yükleniyor...' : placeholder}
      disabled={disabled || !isParentSelected || query.isLoading || query.isError}
      hint={stateHint ?? hint}
    />
  );
}

function getStateHint(
  query: UseQueryResult<CatalogItem[]>,
  isParentSelected: boolean,
  parentHint: string | undefined,
): string | undefined {
  if (!isParentSelected) {
    return parentHint;
  }
  if (query.isError) {
    return `Liste yüklenemedi: ${toApiError(query.error).message}`;
  }
  return undefined;
}
