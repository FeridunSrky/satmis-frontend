import { describe, expect, it } from 'vitest';
import { buildListingDetail } from '@/test/listingFixtures';
import { needsReapproval } from './approval';

const listing = buildListingDetail();

// The validated form output for the fixture listing with nothing changed
const unchanged = {
  title: listing.title,
  description: listing.description ?? undefined,
  price: '650000',
  currency: listing.currency,
  imageIds: [1, 2],
};

describe('needsReapproval', () => {
  it('unchangedActiveListing_doesNotNeedReview', () => {
    expect(needsReapproval(listing, unchanged)).toBe(false);
  });

  it.each([
    ['title', { title: 'Yeni başlık' }],
    ['description', { description: 'Yeni açıklama' }],
    ['clearedDescription', { description: undefined }],
    ['price', { price: '640000' }],
    ['currency', { currency: 'USD' as const }],
    ['addedImage', { imageIds: [1, 2, 3] }],
    ['swappedImage', { imageIds: [1, 3] }],
  ])('%sChanged_needsReview', (_field, change) => {
    expect(needsReapproval(listing, { ...unchanged, ...change })).toBe(true);
  });

  it('reorderedImages_doNotNeedReview', () => {
    expect(needsReapproval(listing, { ...unchanged, imageIds: [2, 1] })).toBe(false);
  });

  it('samePriceWrittenWithDecimals_doesNotNeedReview', () => {
    expect(needsReapproval(listing, { ...unchanged, price: '650000.00' })).toBe(false);
  });

  it('passiveListingWithChangedPrice_needsReview', () => {
    const passive = { ...listing, status: 'PASSIVE' as const };
    expect(needsReapproval(passive, { ...unchanged, price: '1' })).toBe(true);
  });

  it('rejectedListing_alwaysNeedsReview', () => {
    const rejected = { ...listing, status: 'REJECTED' as const };
    expect(needsReapproval(rejected, unchanged)).toBe(true);
  });

  it('pendingListing_isAlreadyInReview', () => {
    const pending = { ...listing, status: 'PENDING_APPROVAL' as const };
    expect(needsReapproval(pending, { ...unchanged, price: '1' })).toBe(false);
  });
});
