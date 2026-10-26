import { describe, expect, it } from 'vitest';
import {
  applyFilterChange,
  parseListingFilters,
  toListingSearchQuery,
  toSearchParams,
} from './searchParams';

function parse(query: string) {
  return parseListingFilters(new URLSearchParams(query));
}

describe('parseListingFilters + toListingSearchQuery', () => {
  it('urlParams_turkishNames_mapToBackendQuery', () => {
    const filters = parse(
      'marka=13&model=131&il=34&min-fiyat=100000&para-birimi=TRY&min-yil=2015&max-km=150000&yakit=DIESEL&kasa=station-wagon&kimden=GALLERY&sirala=PRICE_ASC&sayfa=3',
    );

    expect(toListingSearchQuery(filters)).toEqual({
      brandId: 13,
      modelId: 131,
      cityId: 34,
      minPrice: 100000,
      currency: 'TRY',
      minYear: 2015,
      maxKm: 150000,
      fuelType: 'DIESEL',
      bodyType: 'STATION_WAGON',
      fromWho: 'GALLERY',
      sort: 'PRICE_ASC',
      page: 2,
      size: 20,
    });
  });

  it('page_missing_startsAtZeroForBackend', () => {
    expect(toListingSearchQuery(parse(''))).toEqual({ page: 0, size: 20 });
  });

  it.each([
    ['hasar=var', true],
    ['hasar=yok', false],
  ])('damageParam_%s_becomesBoolean', (query, expected) => {
    expect(parse(query).hasDamageRecord).toBe(expected);
  });

  it('invalidValues_areIgnoredWithoutDroppingValidOnes', () => {
    const filters = parse(
      'marka=abc&model=-4&yakit=WOOD&kasa=tank&hasar=belki&sirala=RANDOM&sayfa=0&min-yil=1800&para-birimi=GBP&vites=AUTOMATIC',
    );

    expect(filters).toEqual({ page: 1, gearType: 'AUTOMATIC' });
  });
});

describe('toSearchParams', () => {
  it('filters_roundTripBackToTurkishUrl', () => {
    const query = 'marka=13&kasa=station-wagon&hasar=yok&sirala=KM_ASC&sayfa=2';

    const params = toSearchParams(parse(query));

    expect(Object.fromEntries(params)).toEqual({
      marka: '13',
      kasa: 'station-wagon',
      hasar: 'yok',
      sirala: 'KM_ASC',
      sayfa: '2',
    });
  });

  it('firstPageAndEmptyFilters_areLeftOutOfUrl', () => {
    expect(toSearchParams({ page: 1 }).toString()).toBe('');
  });
});

describe('applyFilterChange', () => {
  it('brandChange_clearsModelSeriesAndPage', () => {
    const filters = parse('marka=13&model=131&seri=1311&il=34&sayfa=4');

    expect(applyFilterChange(filters, { brandId: 2 })).toEqual({ brandId: 2, cityId: 34, page: 1 });
  });

  it('cityChange_clearsDistrict', () => {
    const filters = parse('il=34&ilce=341&yakit=LPG');

    expect(applyFilterChange(filters, { cityId: 6 })).toEqual({
      cityId: 6,
      fuelType: 'LPG',
      page: 1,
    });
  });

  it('anyOtherChange_resetsPageOnly', () => {
    const filters = parse('marka=13&model=131&sayfa=5');

    expect(applyFilterChange(filters, { gearType: 'MANUAL' })).toEqual({
      brandId: 13,
      modelId: 131,
      gearType: 'MANUAL',
      page: 1,
    });
  });
});
