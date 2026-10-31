import { z } from 'zod';
import {
  CURRENCIES,
  FROM_WHO_VALUES,
  FUEL_TYPES,
  GEAR_TYPES,
  LISTING_SORTS,
  VEHICLE_CONDITIONS,
} from '@/shared/api/enums';
import { BODY_TYPES } from '@/shared/config/bodyTypes';
import { MAX_KEYWORD_LENGTH, normalizeKeyword } from './keyword';
import { MAX_MODEL_YEAR, MIN_MODEL_YEAR } from './listingLimits';
import type { ListingSearchQuery } from './types';

export const LISTINGS_PAGE_SIZE = 20;

/** Turkish URL parameter name for every filter; components never spell these out. */
export const FILTER_PARAM_NAMES = {
  q: 'q',
  brandId: 'marka',
  modelId: 'model',
  seriesId: 'seri',
  cityId: 'il',
  districtId: 'ilce',
  minPrice: 'min-fiyat',
  maxPrice: 'max-fiyat',
  currency: 'para-birimi',
  minYear: 'min-yil',
  maxYear: 'max-yil',
  maxKm: 'max-km',
  fuelType: 'yakit',
  gearType: 'vites',
  bodyType: 'kasa',
  vehicleCondition: 'durum',
  fromWho: 'kimden',
  hasDamageRecord: 'hasar',
  sort: 'sirala',
  page: 'sayfa',
} as const;

const catalogId = z.coerce.number().int().positive();
const modelYear = z.coerce.number().int().min(MIN_MODEL_YEAR).max(MAX_MODEL_YEAR);
const amount = z.coerce.number().positive();
const DAMAGE_PARAM_VALUES = { var: true, yok: false } as const;
const bodyTypeSlugs = BODY_TYPES.map((bodyType) => bodyType.slug) as [string, ...string[]];

// Each URL value is parsed on its own so one bad value never discards the other filters
const filterParsers = {
  // A hand-edited URL may exceed the backend limit; cut it instead of letting the search fail
  q: z.string().transform((keyword) => keyword.slice(0, MAX_KEYWORD_LENGTH).trim()),
  brandId: catalogId,
  modelId: catalogId,
  seriesId: catalogId,
  cityId: catalogId,
  districtId: catalogId,
  minPrice: amount,
  maxPrice: amount,
  currency: z.enum(CURRENCIES),
  minYear: modelYear,
  maxYear: modelYear,
  maxKm: z.coerce.number().int().nonnegative(),
  fuelType: z.enum(FUEL_TYPES),
  gearType: z.enum(GEAR_TYPES),
  bodyType: z.enum(bodyTypeSlugs).transform(slugToBodyType),
  vehicleCondition: z.enum(VEHICLE_CONDITIONS),
  fromWho: z.enum(FROM_WHO_VALUES),
  hasDamageRecord: z.enum(['var', 'yok']).transform((value) => DAMAGE_PARAM_VALUES[value]),
  sort: z.enum(LISTING_SORTS),
  page: z.coerce.number().int().min(1),
};

type FilterParsers = typeof filterParsers;
export type FilterKey = Exclude<keyof FilterParsers, 'page'>;
export type ListingFilters = { [Key in FilterKey]?: z.output<FilterParsers[Key]> } & {
  /** One-based, as shown in the URL. */
  page: number;
};

function slugToBodyType(slug: string) {
  const bodyType = BODY_TYPES.find((option) => option.slug === slug);
  if (!bodyType) {
    throw new Error(`Unknown body type slug: ${slug}`);
  }
  return bodyType.value;
}

export function parseListingFilters(params: URLSearchParams): ListingFilters {
  const filters: Record<string, unknown> = { page: 1 };
  for (const key of Object.keys(filterParsers) as Array<keyof FilterParsers>) {
    const rawValue = params.get(FILTER_PARAM_NAMES[key])?.trim();
    if (!rawValue) {
      continue;
    }
    const parsed = filterParsers[key].safeParse(rawValue);
    if (parsed.success) {
      filters[key] = parsed.data;
    }
  }
  return filters as ListingFilters;
}

// Changing a parent filter makes its children meaningless (a Clio model under BMW)
const DEPENDENT_FILTERS: Partial<Record<FilterKey, FilterKey[]>> = {
  brandId: ['modelId', 'seriesId'],
  modelId: ['seriesId'],
  cityId: ['districtId'],
};

export type FilterPatch = Partial<Omit<ListingFilters, 'page'>>;

/** Applies a filter change: clears dependent filters and returns to the first page. */
export function applyFilterChange(filters: ListingFilters, patch: FilterPatch): ListingFilters {
  const nextFilters: ListingFilters = { ...filters, ...patch, page: 1 };
  for (const changedKey of Object.keys(patch) as FilterKey[]) {
    for (const dependentKey of DEPENDENT_FILTERS[changedKey] ?? []) {
      if (!(dependentKey in patch)) {
        delete nextFilters[dependentKey];
      }
    }
  }
  return nextFilters;
}

export function toSearchParams(filters: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, paramName] of Object.entries(FILTER_PARAM_NAMES)) {
    const urlValue = toUrlValue(key as keyof ListingFilters, filters);
    if (urlValue !== undefined) {
      params.set(paramName, urlValue);
    }
  }
  return params;
}

export const LISTINGS_PATH = '/ilanlar';

export function buildListingsHref(filters: ListingFilters): string {
  const query = toSearchParams(filters).toString();
  return query ? `${LISTINGS_PATH}?${query}` : LISTINGS_PATH;
}

function toUrlValue(key: keyof ListingFilters, filters: ListingFilters): string | undefined {
  const value = filters[key];
  if (value === undefined || (key === 'page' && value === 1)) {
    return undefined;
  }
  if (key === 'bodyType') {
    return BODY_TYPES.find((option) => option.value === value)?.slug;
  }
  if (key === 'hasDamageRecord') {
    return value ? 'var' : 'yok';
  }
  if (key === 'q') {
    return normalizeKeyword(filters.q);
  }
  return String(value);
}

/** URL filters → GET /api/listings query. Backend pages are zero-based. */
export function toListingSearchQuery({ page, ...filters }: ListingFilters): ListingSearchQuery {
  return { ...filters, page: page - 1, size: LISTINGS_PAGE_SIZE };
}

/** Reads `?sayfa=` on pages that only paginate (my listings, favourites). */
export function parsePageParam(params: URLSearchParams): number {
  const parsed = filterParsers.page.safeParse(params.get(FILTER_PARAM_NAMES.page));
  return parsed.success ? parsed.data : 1;
}

export function buildPageHref(pathname: string, params: URLSearchParams, page: number): string {
  const nextParams = new URLSearchParams(params);
  if (page <= 1) {
    nextParams.delete(FILTER_PARAM_NAMES.page);
  } else {
    nextParams.set(FILTER_PARAM_NAMES.page, String(page));
  }
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const NON_PANEL_KEYS: ReadonlyArray<keyof ListingFilters> = ['page', 'sort', 'q'];

/** Counts the filters set in the filter panel; the keyword has its own search box. */
export function countActiveFilters(filters: ListingFilters): number {
  return (Object.keys(filters) as Array<keyof ListingFilters>).filter(
    (key) => !NON_PANEL_KEYS.includes(key) && filters[key] !== undefined,
  ).length;
}
