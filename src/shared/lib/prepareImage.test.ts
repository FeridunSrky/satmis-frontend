import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrokenPhoto, createTestPhoto, installImageFakes } from '@/test/imageMocks';
import { NOT_AN_IMAGE_MESSAGE, prepareImage, UNREADABLE_IMAGE_MESSAGE } from './prepareImage';

describe('prepareImage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prepareImage_largeLandscapePhoto_shrinksLongEdgeTo2048AndEncodesWebp', async () => {
    const canvas = installImageFakes();
    const photo = createTestPhoto(4032, 3024);

    const prepared = await prepareImage(photo);

    expect(canvas.sizes).toEqual([{ width: 2048, height: 1536 }]);
    expect(prepared.contentType).toBe('image/webp');
    expect(prepared.blob.type).toBe('image/webp');
    expect(prepared.blob.size).toBeLessThan(photo.size);
    expect(canvas.closedBitmaps).toBe(1);
  });

  it('prepareImage_largePortraitPhoto_shrinksHeightTo2048', async () => {
    const canvas = installImageFakes();

    await prepareImage(createTestPhoto(3000, 4000));

    expect(canvas.sizes).toEqual([{ width: 1536, height: 2048 }]);
  });

  it('prepareImage_smallPhoto_isReencodedWithoutUpscaling', async () => {
    const canvas = installImageFakes();

    const prepared = await prepareImage(createTestPhoto(800, 600));

    expect(canvas.sizes).toEqual([{ width: 800, height: 600 }]);
    expect(prepared.blob.type).toBe('image/webp');
  });

  it('prepareImage_browserWithoutWebp_fallsBackToJpeg', async () => {
    installImageFakes({ webpSupported: false });

    const prepared = await prepareImage(createTestPhoto(1200, 900));

    expect(prepared.contentType).toBe('image/jpeg');
    expect(prepared.blob.type).toBe('image/jpeg');
  });

  it('prepareImage_notAnImage_isRejectedBeforeDecoding', async () => {
    const canvas = installImageFakes();
    const document = new File(['%PDF'], 'ruhsat.pdf', { type: 'application/pdf' });

    await expect(prepareImage(document)).rejects.toThrow(NOT_AN_IMAGE_MESSAGE);
    expect(canvas.sizes).toEqual([]);
  });

  it('prepareImage_undecodableImage_explainsWhichFormatsWork', async () => {
    installImageFakes();

    await expect(prepareImage(createBrokenPhoto('foto.heic'))).rejects.toThrow(
      UNREADABLE_IMAGE_MESSAGE,
    );
  });
});
