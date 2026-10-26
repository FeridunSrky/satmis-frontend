import { useFormContext } from 'react-hook-form';
import { SelectField } from '@/shared/components/SelectField';
import { TextAreaField } from '@/shared/components/TextAreaField';
import { TextField } from '@/shared/components/TextField';
import { CURRENCY_LABELS, toOptions } from '@/shared/config/vehicleLabels';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../listingLimits';
import { FormSection } from './FormSection';
import type { ListingFormInput } from './listingFormSchema';

export function ListingInfoSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ListingFormInput>();

  return (
    <FormSection title="İlan bilgileri">
      <TextField
        className="sm:col-span-2"
        label="Başlık"
        maxLength={TITLE_MAX_LENGTH}
        placeholder="Örn. Hatasız, bakımları yetkili serviste yapılmış Clio"
        error={errors.title?.message}
        {...register('title')}
      />
      <TextAreaField
        className="sm:col-span-2"
        label="Açıklama (isteğe bağlı)"
        maxLength={DESCRIPTION_MAX_LENGTH}
        hint="Bakım geçmişi, değişen parçalar, ekstra donanımlar gibi alıcının bilmesi gerekenler."
        error={errors.description?.message}
        {...register('description')}
      />
      <TextField
        label="Fiyat"
        inputMode="decimal"
        placeholder="650000"
        error={errors.price?.message}
        {...register('price')}
      />
      <SelectField
        label="Para birimi"
        options={toOptions(CURRENCY_LABELS)}
        error={errors.currency?.message}
        {...register('currency')}
      />
    </FormSection>
  );
}
