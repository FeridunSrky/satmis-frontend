const MAX_EDGE_PX = 2048;
const ENCODE_QUALITY = 0.85;
const MAX_BYTES = 10 * 1024 * 1024;
const PREFERRED_TYPE = 'image/webp';
const FALLBACK_TYPE = 'image/jpeg';

type PreparedImageType = typeof PREFERRED_TYPE | typeof FALLBACK_TYPE;

export interface PreparedImage {
  blob: Blob;
  contentType: PreparedImageType;
}

/** Carries a message meant for the user. */
export class ImagePreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImagePreparationError';
  }
}

export const NOT_AN_IMAGE_MESSAGE = 'Bu dosya bir görsel değil';
export const UNREADABLE_IMAGE_MESSAGE = 'Bu görsel açılamadı, JPEG veya PNG olarak deneyin';
const IMAGE_TOO_LARGE_MESSAGE = 'Görsel 10 MB’tan büyük olamaz';
const ENCODE_FAILED_MESSAGE = 'Görsel hazırlanamadı, lütfen tekrar deneyin';

/**
 * Downscales a photo to at most 2048 px on the long edge and re-encodes it. Re-encoding drops
 * all EXIF data, GPS position included, which is why the original file is never uploaded.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new ImagePreparationError(NOT_AN_IMAGE_MESSAGE);
  }
  const bitmap = await openBitmap(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE_PX);
    const prepared = await encode(bitmap, width, height);
    if (prepared.blob.size > MAX_BYTES) {
      throw new ImagePreparationError(IMAGE_TOO_LARGE_MESSAGE);
    }
    return prepared;
  } finally {
    bitmap.close();
  }
}

async function openBitmap(file: File): Promise<ImageBitmap> {
  try {
    // Applies the EXIF orientation, so a phone photo taken sideways is not uploaded sideways
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // e.g. HEIC in Chrome; the browser's own error says nothing useful to the user
    throw new ImagePreparationError(UNREADABLE_IMAGE_MESSAGE);
  }
}

/** Keeps the aspect ratio; never upscales. */
function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function encode(bitmap: ImageBitmap, width: number, height: number): Promise<PreparedImage> {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImagePreparationError(ENCODE_FAILED_MESSAGE);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  const webp = await toBlob(canvas, PREFERRED_TYPE);
  // Browsers that cannot write WebP silently fall back to PNG, which would be far larger
  if (webp?.type === PREFERRED_TYPE) {
    return { blob: webp, contentType: PREFERRED_TYPE };
  }
  const jpeg = await toBlob(canvas, FALLBACK_TYPE);
  if (jpeg?.type !== FALLBACK_TYPE) {
    throw new ImagePreparationError(ENCODE_FAILED_MESSAGE);
  }
  return { blob: jpeg, contentType: FALLBACK_TYPE };
}

type DrawingCanvas = OffscreenCanvas | HTMLCanvasElement;

function createCanvas(width: number, height: number): DrawingCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toBlob(canvas: DrawingCanvas, type: string): Promise<Blob | null> {
  if (canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, ENCODE_QUALITY));
  }
  return canvas.convertToBlob({ type, quality: ENCODE_QUALITY });
}
