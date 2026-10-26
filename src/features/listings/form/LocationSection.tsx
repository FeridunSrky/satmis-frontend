import { useWatch } from 'react-hook-form';
import { useCities, useDistricts } from '@/features/catalog/hooks/useCatalog';
import { CatalogField } from './CatalogField';
import { FormSection } from './FormSection';
import type { ListingFormInput } from './listingFormSchema';
import { toSelectedId } from './toSelectedId';

export function LocationSection() {
  const cityId = toSelectedId(useWatch<ListingFormInput, 'cityId'>({ name: 'cityId' }));
  const citiesQuery = useCities();
  const districtsQuery = useDistricts(cityId);

  return (
    <FormSection title="Konum" description="Aracın görülebileceği yer.">
      <CatalogField name="cityId" label="İl" query={citiesQuery} dependentFields={['districtId']} />
      <CatalogField
        name="districtId"
        label="İlçe"
        query={districtsQuery}
        isParentSelected={cityId !== undefined}
        parentHint="Önce il seçin"
      />
    </FormSection>
  );
}
