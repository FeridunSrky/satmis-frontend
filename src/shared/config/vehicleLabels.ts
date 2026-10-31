import type {
  CurrencyType,
  FromWho,
  FuelType,
  GearType,
  ListingSort,
  ListingStatus,
  Traction,
  VehicleCondition,
} from '@/shared/api/enums';

// Turkish labels for backend enums; BodyType labels live in bodyTypes.ts with their URL slugs
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  PENDING_APPROVAL: 'Onay bekliyor',
  ACTIVE: 'Yayında',
  PASSIVE: 'Yayında değil',
  SOLD: 'Satıldı',
  REJECTED: 'Reddedildi',
};

export const CURRENCY_LABELS: Record<CurrencyType, string> = {
  TRY: '₺ TL',
  USD: '$ Dolar',
  EUR: '€ Euro',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: 'Benzin',
  DIESEL: 'Dizel',
  LPG: 'LPG',
  HYBRID: 'Hibrit',
  ELECTRIC: 'Elektrik',
};

export const GEAR_TYPE_LABELS: Record<GearType, string> = {
  MANUAL: 'Manuel',
  AUTOMATIC: 'Otomatik',
  SEMI_AUTOMATIC: 'Yarı otomatik',
};

export const TRACTION_LABELS: Record<Traction, string> = {
  FWD: 'Önden çekiş',
  RWD: 'Arkadan itiş',
  AWD: '4x4',
};

export const VEHICLE_CONDITION_LABELS: Record<VehicleCondition, string> = {
  NEW: 'Sıfır',
  USED: 'İkinci el',
};

export const FROM_WHO_LABELS: Record<FromWho, string> = {
  OWNER: 'Sahibinden',
  GALLERY: 'Galeriden',
  AUTHORIZED_DEALER: 'Yetkili bayiden',
};

export const LISTING_SORT_LABELS: Record<ListingSort, string> = {
  NEWEST: 'En yeni ilan',
  OLDEST: 'En eski ilan',
  PRICE_ASC: 'Fiyat: düşükten yükseğe',
  PRICE_DESC: 'Fiyat: yüksekten düşüğe',
  YEAR_DESC: 'Model yılı: yeniden eskiye',
  YEAR_ASC: 'Model yılı: eskiden yeniye',
  KM_ASC: 'Kilometre: azdan çoğa',
  KM_DESC: 'Kilometre: çoktan aza',
};

export function toOptions<TValue extends string>(labels: Record<TValue, string>) {
  return (Object.keys(labels) as TValue[]).map((value) => ({ value, label: labels[value] }));
}
