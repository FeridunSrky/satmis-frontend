import { z } from 'zod';
import {
  BODY_TYPE_VALUES,
  CURRENCIES,
  FROM_WHO_VALUES,
  FUEL_TYPES,
  GEAR_TYPES,
  TRACTIONS,
  VEHICLE_CONDITIONS,
} from '@/shared/api/enums';
import {
  COLOR_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMAGE_URL_MAX_LENGTH,
  MAX_ENGINE_CAPACITY,
  MAX_ENGINE_POWER,
  MAX_IMAGES,
  MAX_KILOMETER,
  MAX_MODEL_YEAR,
  MIN_IMAGES,
  MIN_MODEL_YEAR,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
} from '../listingLimits';

// Up to 13 integer and 2 decimal digits, as the backend's BigDecimal column allows
const PRICE_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;
const DIGITS_ONLY = /^\d+$/;
const HTTPS_URL = /^https:\/\/\S+$/;

function requiredSelection(message: string) {
  return z.string().min(1, message).transform(Number);
}

function requiredInteger(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} zorunludur`)
    .regex(DIGITS_ONLY, `${label} tam sayı olmalıdır`)
    .transform(Number)
    .refine(
      (value) => value >= min && value <= max,
      `${label} ${min} ile ${max} arasında olmalıdır`,
    );
}

function optionalInteger(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || DIGITS_ONLY.test(value), `${label} tam sayı olmalıdır`)
    .transform((value) => (value === '' ? undefined : Number(value)))
    .refine(
      (value) => value === undefined || (value >= min && value <= max),
      `${label} ${min} ile ${max} arasında olmalıdır`,
    );
}

function requiredChoice<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
  message: string,
) {
  return z.enum(values, { error: message });
}

function optionalChoice<const TValues extends readonly [string, ...string[]]>(values: TValues) {
  return z
    .union([z.literal(''), z.enum(values)])
    .transform((value) => (value === '' ? undefined : value));
}

function optionalText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} en fazla ${maxLength} karakter olabilir`)
    .transform((value) => (value === '' ? undefined : value));
}

const priceSchema = z
  .string()
  .trim()
  .min(1, 'Fiyat zorunludur')
  // Accept the Turkish decimal comma ("650000,50"), send the dot the backend expects
  .transform((value) => value.replace(/\s/g, '').replace(',', '.'))
  .refine((value) => PRICE_PATTERN.test(value), {
    message:
      'Fiyatı nokta kullanmadan, en fazla 2 kuruş hanesiyle yazın (örn. 650000 veya 650000,50)',
  })
  .refine((value) => Number(value) > 0, 'Fiyat sıfırdan büyük olmalıdır');

const imageUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Görsel adresi boş olamaz')
    .max(IMAGE_URL_MAX_LENGTH, `Görsel adresi en fazla ${IMAGE_URL_MAX_LENGTH} karakter olabilir`)
    .regex(HTTPS_URL, 'Görsel adresi https:// ile başlamalıdır'),
});

export const listingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN_LENGTH, `Başlık en az ${TITLE_MIN_LENGTH} karakter olmalıdır`)
    .max(TITLE_MAX_LENGTH, `Başlık en fazla ${TITLE_MAX_LENGTH} karakter olabilir`),
  description: optionalText('Açıklama', DESCRIPTION_MAX_LENGTH),
  price: priceSchema,
  currency: requiredChoice(CURRENCIES, 'Para birimi seçin'),
  // Brand, model and city only drive the cascading selects; they are not sent
  brandId: requiredSelection('Marka seçin'),
  modelId: requiredSelection('Model seçin'),
  cityId: requiredSelection('İl seçin'),
  districtId: requiredSelection('İlçe seçin'),
  vehicle: z.object({
    seriesId: requiredSelection('Seri seçin'),
    modelYear: requiredInteger('Model yılı', MIN_MODEL_YEAR, MAX_MODEL_YEAR),
    kilometer: requiredInteger('Kilometre', 0, MAX_KILOMETER),
    fuelType: requiredChoice(FUEL_TYPES, 'Yakıt tipi seçin'),
    gearType: requiredChoice(GEAR_TYPES, 'Vites tipi seçin'),
    bodyType: optionalChoice(BODY_TYPE_VALUES),
    color: optionalText('Renk', COLOR_MAX_LENGTH),
    enginePower: optionalInteger('Motor gücü', 1, MAX_ENGINE_POWER),
    engineCapacity: optionalInteger('Motor hacmi', 1, MAX_ENGINE_CAPACITY),
    traction: optionalChoice(TRACTIONS),
    vehicleCondition: requiredChoice(VEHICLE_CONDITIONS, 'Aracın durumunu seçin'),
    fromWho: requiredChoice(FROM_WHO_VALUES, 'Kimden satıldığını seçin'),
    hasDamageRecord: z.boolean(),
    exchangeable: z.boolean(),
  }),
  imageUrls: z
    .array(imageUrlSchema)
    .min(MIN_IMAGES, `En az ${MIN_IMAGES} görsel ekleyin`)
    .max(MAX_IMAGES, `En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz`),
});

export type ListingFormInput = z.input<typeof listingFormSchema>;
export type ListingFormOutput = z.output<typeof listingFormSchema>;
