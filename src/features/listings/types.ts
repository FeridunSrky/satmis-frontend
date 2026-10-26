import type {
  BodyType,
  CurrencyType,
  FromWho,
  FuelType,
  GearType,
  ListingSort,
  ListingStatus,
  Traction,
  VehicleCondition,
} from '@/shared/api/enums';

export interface ListingSummary {
  id: number;
  title: string;
  price: number;
  currency: CurrencyType;
  status: ListingStatus;
  createdAt: string;
  cityName: string;
  districtName: string;
  brandName: string;
  modelName: string;
  seriesName: string;
  modelYear: number;
  kilometer: number;
  fuelType: FuelType;
  gearType: GearType;
  coverImageUrl: string | null;
}

export interface ListingVehicle {
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  seriesId: number;
  seriesName: string;
  modelYear: number;
  kilometer: number;
  fuelType: FuelType;
  gearType: GearType;
  bodyType: BodyType | null;
  color: string | null;
  enginePower: number | null;
  engineCapacity: number | null;
  traction: Traction | null;
  vehicleCondition: VehicleCondition;
  fromWho: FromWho;
  hasDamageRecord: boolean;
  exchangeable: boolean;
}

export interface ListingImage {
  id: number;
  url: string;
  displayOrder: number;
  cover: boolean;
}

export interface ListingDetail {
  id: number;
  /** Optimistic-locking version; sent back on update. */
  version: number;
  title: string;
  description: string | null;
  price: number;
  currency: CurrencyType;
  status: ListingStatus;
  viewCount: number;
  favoriteCount: number;
  favoritedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  seller: { id: number; firstName: string; lastName: string };
  location: { cityId: number; cityName: string; districtId: number; districtName: string };
  vehicle: ListingVehicle;
  images: ListingImage[];
}

export interface ListingVehicleRequest {
  seriesId: number;
  modelYear: number;
  kilometer: number;
  fuelType: FuelType;
  gearType: GearType;
  bodyType?: BodyType;
  color?: string;
  enginePower?: number;
  engineCapacity?: number;
  traction?: Traction;
  vehicleCondition: VehicleCondition;
  fromWho: FromWho;
  hasDamageRecord: boolean;
  exchangeable: boolean;
}

export interface ListingRequest {
  /** Required on PUT only. */
  version?: number;
  title: string;
  description?: string;
  /** Sent as a string so decimal amounts are never rounded by floating point. */
  price: string;
  currency: CurrencyType;
  districtId: number;
  vehicle: ListingVehicleRequest;
  imageUrls: string[];
}

export interface ChangeStatusRequest {
  status: ListingStatus;
}

/** Query parameters of GET /api/listings, named as the backend expects them. */
export interface ListingSearchQuery {
  brandId?: number;
  modelId?: number;
  seriesId?: number;
  cityId?: number;
  districtId?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: CurrencyType;
  minYear?: number;
  maxYear?: number;
  maxKm?: number;
  fuelType?: FuelType;
  gearType?: GearType;
  bodyType?: BodyType;
  vehicleCondition?: VehicleCondition;
  fromWho?: FromWho;
  hasDamageRecord?: boolean;
  sort?: ListingSort;
  page: number;
  size: number;
}
