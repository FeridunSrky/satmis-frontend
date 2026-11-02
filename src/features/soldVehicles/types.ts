import type { ListingDetail, ListingSearchQuery } from '@/features/listings/types';
import type { CurrencyType, FuelType, GearType, SoldVehicleSort } from '@/shared/api/enums';

/** Same filters as the listing search; the price range applies to the sale price. */
export type SoldVehicleSearchQuery = Omit<ListingSearchQuery, 'sort'> & { sort?: SoldVehicleSort };

/** The summary takes the filters only; it is neither sorted nor paged. */
export type SoldVehicleFilterQuery = Omit<SoldVehicleSearchQuery, 'sort' | 'page' | 'size'>;

/** No seller details: the sold vehicles endpoints never return them. */
export interface SoldVehicleSummary {
  id: number;
  title: string;
  /** The price the listing asked for. */
  listingPrice: number;
  salePrice: number;
  currency: CurrencyType;
  /** ISO-8601 UTC. */
  soldAt: string;
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

export interface SoldVehicleDetail {
  id: number;
  title: string;
  description: string | null;
  listingPrice: number;
  salePrice: number;
  currency: CurrencyType;
  saleNote: string | null;
  /** ISO-8601 UTC. */
  soldAt: string;
  /** ISO-8601 UTC; when the listing was opened. */
  createdAt: string;
  location: ListingDetail['location'];
  vehicle: ListingDetail['vehicle'];
  images: ListingDetail['images'];
}

export interface CurrencyPriceSummary {
  currency: CurrencyType;
  count: number;
  /** Rounded to 2 decimals. */
  average: number;
  min: number;
  max: number;
}

/** One entry per currency, the one with most sales first; empty when nothing matches. */
export interface SalePriceSummary {
  currencies: CurrencyPriceSummary[];
}

/** The summary must describe the same sales as the list, whatever page or order is shown. */
export function toSoldVehicleFilterQuery({
  sort: _sort,
  page: _page,
  size: _size,
  ...filters
}: SoldVehicleSearchQuery): SoldVehicleFilterQuery {
  return filters;
}
