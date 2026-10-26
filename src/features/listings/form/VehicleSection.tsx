import { useFormContext, useWatch } from 'react-hook-form';
import { useBrands, useModels, useSeries } from '@/features/catalog/hooks/useCatalog';
import { CheckboxField } from '@/shared/components/CheckboxField';
import { SelectField } from '@/shared/components/SelectField';
import { TextField } from '@/shared/components/TextField';
import { BODY_TYPES } from '@/shared/config/bodyTypes';
import {
  FROM_WHO_LABELS,
  FUEL_TYPE_LABELS,
  GEAR_TYPE_LABELS,
  toOptions,
  TRACTION_LABELS,
  VEHICLE_CONDITION_LABELS,
} from '@/shared/config/vehicleLabels';
import { COLOR_MAX_LENGTH, MAX_MODEL_YEAR, MIN_MODEL_YEAR } from '../listingLimits';
import { CatalogField } from './CatalogField';
import { FormSection } from './FormSection';
import type { ListingFormInput } from './listingFormSchema';
import { toSelectedId } from './toSelectedId';

const BODY_TYPE_OPTIONS = BODY_TYPES.map(({ value, label }) => ({ value, label }));

function VehicleCatalogFields() {
  const brandId = toSelectedId(useWatch<ListingFormInput, 'brandId'>({ name: 'brandId' }));
  const modelId = toSelectedId(useWatch<ListingFormInput, 'modelId'>({ name: 'modelId' }));
  const brandsQuery = useBrands();
  const modelsQuery = useModels(brandId);
  const seriesQuery = useSeries(modelId);

  return (
    <>
      <CatalogField
        name="brandId"
        label="Marka"
        query={brandsQuery}
        dependentFields={['modelId', 'vehicle.seriesId']}
      />
      <CatalogField
        name="modelId"
        label="Model"
        query={modelsQuery}
        isParentSelected={brandId !== undefined}
        parentHint="Önce marka seçin"
        dependentFields={['vehicle.seriesId']}
      />
      <CatalogField
        name="vehicle.seriesId"
        label="Seri"
        query={seriesQuery}
        isParentSelected={modelId !== undefined}
        parentHint="Önce model seçin"
      />
    </>
  );
}

export function VehicleSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ListingFormInput>();
  const vehicleErrors = errors.vehicle;

  return (
    <FormSection title="Araç" description="Marka, model ve seri sırayla seçilir.">
      <VehicleCatalogFields />
      <TextField
        label="Model yılı"
        inputMode="numeric"
        placeholder={String(MAX_MODEL_YEAR - 1)}
        hint={`${MIN_MODEL_YEAR} – ${MAX_MODEL_YEAR}`}
        error={vehicleErrors?.modelYear?.message}
        {...register('vehicle.modelYear')}
      />
      <TextField
        label="Kilometre"
        inputMode="numeric"
        placeholder="85000"
        error={vehicleErrors?.kilometer?.message}
        {...register('vehicle.kilometer')}
      />
      <SelectField
        label="Yakıt"
        placeholder="Seçin"
        options={toOptions(FUEL_TYPE_LABELS)}
        error={vehicleErrors?.fuelType?.message}
        {...register('vehicle.fuelType')}
      />
      <SelectField
        label="Vites"
        placeholder="Seçin"
        options={toOptions(GEAR_TYPE_LABELS)}
        error={vehicleErrors?.gearType?.message}
        {...register('vehicle.gearType')}
      />
      <SelectField
        label="Durumu"
        options={toOptions(VEHICLE_CONDITION_LABELS)}
        error={vehicleErrors?.vehicleCondition?.message}
        {...register('vehicle.vehicleCondition')}
      />
      <SelectField
        label="Kimden"
        options={toOptions(FROM_WHO_LABELS)}
        error={vehicleErrors?.fromWho?.message}
        {...register('vehicle.fromWho')}
      />
      <SelectField
        label="Kasa tipi (isteğe bağlı)"
        placeholder="Belirtilmedi"
        options={BODY_TYPE_OPTIONS}
        error={vehicleErrors?.bodyType?.message}
        {...register('vehicle.bodyType')}
      />
      <SelectField
        label="Çekiş (isteğe bağlı)"
        placeholder="Belirtilmedi"
        options={toOptions(TRACTION_LABELS)}
        error={vehicleErrors?.traction?.message}
        {...register('vehicle.traction')}
      />
      <TextField
        label="Motor gücü, hp (isteğe bağlı)"
        inputMode="numeric"
        error={vehicleErrors?.enginePower?.message}
        {...register('vehicle.enginePower')}
      />
      <TextField
        label="Motor hacmi, cc (isteğe bağlı)"
        inputMode="numeric"
        error={vehicleErrors?.engineCapacity?.message}
        {...register('vehicle.engineCapacity')}
      />
      <TextField
        label="Renk (isteğe bağlı)"
        maxLength={COLOR_MAX_LENGTH}
        error={vehicleErrors?.color?.message}
        {...register('vehicle.color')}
      />
      <div className="flex flex-col justify-end gap-3 pb-2">
        <CheckboxField label="Hasar kaydı var" {...register('vehicle.hasDamageRecord')} />
        <CheckboxField label="Takasa uygun" {...register('vehicle.exchangeable')} />
      </div>
    </FormSection>
  );
}
