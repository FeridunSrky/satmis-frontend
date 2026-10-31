import { SearchForm, type SearchFormProps } from '@/shared/components/SearchForm';
import { MAX_KEYWORD_LENGTH } from '../keyword';

type ListingSearchFormProps = Omit<SearchFormProps, 'label' | 'placeholder' | 'maxLength'>;

/** Keyword search over listings; the text is sent as typed apart from trimming. */
export function ListingSearchForm(props: ListingSearchFormProps) {
  return (
    <SearchForm
      label="İlanlarda ara"
      placeholder="Marka, model ya da kelime ara"
      maxLength={MAX_KEYWORD_LENGTH}
      {...props}
    />
  );
}
