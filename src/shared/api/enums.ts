// Backend enum values (see /v3/api-docs). Kept as arrays so Zod schemas and selects share them.
export const CURRENCIES = ['TRY', 'USD', 'EUR'] as const;
export const LISTING_STATUSES = [
  'PENDING_APPROVAL',
  'ACTIVE',
  'PASSIVE',
  'SOLD',
  'REJECTED',
] as const;
export const FUEL_TYPES = ['GASOLINE', 'DIESEL', 'LPG', 'HYBRID', 'ELECTRIC'] as const;
export const GEAR_TYPES = ['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC'] as const;
export const BODY_TYPE_VALUES = [
  'SEDAN',
  'HATCHBACK',
  'SUV',
  'STATION_WAGON',
  'COUPE',
  'CABRIO',
  'PICKUP',
  'MPV',
] as const;
export const TRACTIONS = ['FWD', 'RWD', 'AWD'] as const;
export const VEHICLE_CONDITIONS = ['NEW', 'USED'] as const;
export const FROM_WHO_VALUES = ['OWNER', 'GALLERY', 'AUTHORIZED_DEALER'] as const;
export const LISTING_SORTS = [
  'NEWEST',
  'OLDEST',
  'PRICE_ASC',
  'PRICE_DESC',
  'YEAR_DESC',
  'YEAR_ASC',
  'KM_ASC',
  'KM_DESC',
] as const;

export type CurrencyType = (typeof CURRENCIES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type GearType = (typeof GEAR_TYPES)[number];
export type BodyType = (typeof BODY_TYPE_VALUES)[number];
export type Traction = (typeof TRACTIONS)[number];
export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number];
export type FromWho = (typeof FROM_WHO_VALUES)[number];
export type ListingSort = (typeof LISTING_SORTS)[number];
