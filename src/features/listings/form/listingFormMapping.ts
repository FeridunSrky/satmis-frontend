import type { Path } from 'react-hook-form';
import type { ExistingImage } from '../hooks/useListingImages';
import type { ListingDetail, ListingRequest } from '../types';
import type { ListingFormInput, ListingFormOutput } from './listingFormSchema';

export const EMPTY_LISTING_FORM: ListingFormInput = {
  title: '',
  description: '',
  price: '',
  currency: 'TRY',
  brandId: '',
  modelId: '',
  cityId: '',
  districtId: '',
  vehicle: {
    seriesId: '',
    modelYear: '',
    kilometer: '',
    fuelType: '' as ListingFormInput['vehicle']['fuelType'],
    gearType: '' as ListingFormInput['vehicle']['gearType'],
    bodyType: '',
    color: '',
    enginePower: '',
    engineCapacity: '',
    traction: '',
    vehicleCondition: 'USED',
    fromWho: 'OWNER',
    hasDamageRecord: false,
    exchangeable: false,
  },
  imageIds: [],
};

/**
 * Form field names equal the backend `errors` keys (`vehicle.modelYear`, `imageIds`…),
 * so server validation errors land on the right field without extra mapping.
 */
export const LISTING_FORM_FIELDS: ReadonlyArray<Path<ListingFormInput>> = [
  'title',
  'description',
  'price',
  'currency',
  'districtId',
  'vehicle.seriesId',
  'vehicle.modelYear',
  'vehicle.kilometer',
  'vehicle.fuelType',
  'vehicle.gearType',
  'vehicle.bodyType',
  'vehicle.color',
  'vehicle.enginePower',
  'vehicle.engineCapacity',
  'vehicle.traction',
  'vehicle.vehicleCondition',
  'vehicle.fromWho',
  'vehicle.hasDamageRecord',
  'vehicle.exchangeable',
  'imageIds',
];

export function toListingRequest(values: ListingFormOutput): ListingRequest {
  const { brandId: _brandId, modelId: _modelId, cityId: _cityId, ...request } = values;
  return request;
}

const toText = (value: number | string | null) => (value === null ? '' : String(value));

export function toListingFormValues(listing: ListingDetail): ListingFormInput {
  const { vehicle, location } = listing;
  return {
    title: listing.title,
    description: listing.description ?? '',
    price: String(listing.price),
    currency: listing.currency,
    brandId: String(vehicle.brandId),
    modelId: String(vehicle.modelId),
    cityId: String(location.cityId),
    districtId: String(location.districtId),
    vehicle: {
      seriesId: String(vehicle.seriesId),
      modelYear: String(vehicle.modelYear),
      kilometer: String(vehicle.kilometer),
      fuelType: vehicle.fuelType,
      gearType: vehicle.gearType,
      bodyType: vehicle.bodyType ?? '',
      color: vehicle.color ?? '',
      enginePower: toText(vehicle.enginePower),
      engineCapacity: toText(vehicle.engineCapacity),
      traction: vehicle.traction ?? '',
      vehicleCondition: vehicle.vehicleCondition,
      fromWho: vehicle.fromWho,
      hasDamageRecord: vehicle.hasDamageRecord,
      exchangeable: vehicle.exchangeable,
    },
    imageIds: toExistingImages(listing).map((image) => image.id),
  };
}

/** The listing's images in display order, the cover first. */
export function toExistingImages(listing: ListingDetail): ExistingImage[] {
  return [...listing.images]
    .sort((first, second) => first.displayOrder - second.displayOrder)
    .map(({ id, url }) => ({ id, url }));
}
