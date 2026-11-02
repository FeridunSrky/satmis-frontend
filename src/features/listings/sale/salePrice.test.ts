import { describe, expect, it } from 'vitest';
import { describePriceDifference, isWithinRange, salePriceRange } from './salePrice';

describe('salePriceRange', () => {
  it('wholePrice_isEightyToHundredTenPercent', () => {
    expect(salePriceRange(750000)).toEqual({ min: 600000, max: 825000 });
  });

  it('priceWithKurus_roundsInwardsToWholeKurus', () => {
    // 80 % of 1000.01 is 800.008 → up to 800.01; 110 % is 1100.011 → down to 1100.01
    expect(salePriceRange(1000.01)).toEqual({ min: 800.01, max: 1100.01 });
  });

  it('tinyPrice_keepsKurusPrecision', () => {
    expect(salePriceRange(0.05)).toEqual({ min: 0.04, max: 0.05 });
  });

  it('largestAllowedPrice_doesNotLoseKurus', () => {
    // 80 % is 7999999999999.992 (up to 8000000000000.00), 110 % 10999999999999.989 (down)
    expect(salePriceRange(9999999999999.99)).toEqual({
      min: 8000000000000,
      max: 10999999999999.98,
    });
  });

  it('bounds_areIncluded', () => {
    const range = salePriceRange(750000);
    expect(isWithinRange(600000, range)).toBe(true);
    expect(isWithinRange(825000, range)).toBe(true);
    expect(isWithinRange(599999.99, range)).toBe(false);
    expect(isWithinRange(825000.01, range)).toBe(false);
  });
});

describe('describePriceDifference', () => {
  it.each([
    [750000, 720000, '%4 pazarlık'],
    [750000, 750000, 'İlan fiyatına satıldı'],
    [750000, 772500, 'İlan fiyatının %3 üzerinde'],
    [750000, 749000, '%1’den az pazarlık'],
  ])('listing %d sold for %d_says "%s"', (listingPrice, salePrice, expected) => {
    expect(describePriceDifference(listingPrice, salePrice)).toBe(expected);
  });
});
