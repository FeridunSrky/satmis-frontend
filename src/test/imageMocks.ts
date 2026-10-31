import { http as mockHttp, HttpResponse } from 'msw/http';
import { vi } from 'vitest';
import type { ImageUpload } from '@/features/listings/types';
import { buildErrorResponse } from './fixtures';
import { apiUrl, server } from './server';

/**
 * jsdom has no image decoding, canvas encoding or object URLs. These fakes stand in for them:
 * a test photo "decodes" to the size it was created with, and the canvas encodes to a blob
 * whose size depends on the drawn size, so downscaling is visible in the uploaded bytes.
 */
const photoSizes = new WeakMap<Blob, { width: number; height: number }>();

export interface CanvasLog {
  sizes: Array<{ width: number; height: number }>;
  closedBitmaps: number;
  revokedUrls: string[];
}

export function createTestPhoto(width: number, height: number, name = 'foto.jpg'): File {
  const photo = new File([new Uint8Array(width * height)], name, { type: 'image/jpeg' });
  photoSizes.set(photo, { width, height });
  return photo;
}

/** Looks like a JPEG to the file picker but cannot be decoded, like a renamed text file. */
export function createBrokenPhoto(name = 'bozuk.jpg'): File {
  return new File(['metin'], name, { type: 'image/jpeg' });
}

export function installImageFakes({ webpSupported = true } = {}): CanvasLog {
  const log: CanvasLog = { sizes: [], closedBitmaps: 0, revokedUrls: [] };
  vi.stubGlobal('createImageBitmap', async (source: Blob) => {
    const size = photoSizes.get(source);
    if (!size) {
      throw new DOMException('The source image could not be decoded.', 'InvalidStateError');
    }
    return { ...size, close: () => (log.closedBitmaps += 1) };
  });
  vi.stubGlobal('OffscreenCanvas', createFakeCanvasClass(log, webpSupported));
  let nextObjectUrl = 0;
  // jsdom lacks both functions, so they are defined rather than spied on
  defineOnUrl('createObjectURL', () => `blob:preview-${(nextObjectUrl += 1)}`);
  defineOnUrl('revokeObjectURL', (objectUrl: string) => log.revokedUrls.push(objectUrl));
  return log;
}

function defineOnUrl(name: 'createObjectURL' | 'revokeObjectURL', implementation: unknown) {
  Object.defineProperty(URL, name, { value: implementation, configurable: true, writable: true });
}

function createFakeCanvasClass(log: CanvasLog, webpSupported: boolean) {
  return class FakeOffscreenCanvas {
    readonly width: number;
    readonly height: number;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      log.sizes.push({ width, height });
    }

    getContext() {
      return { drawImage: () => undefined };
    }

    async convertToBlob({ type }: { type: string }) {
      // Like real browsers, an unsupported type silently comes back as PNG
      const encodedType = type === 'image/webp' && !webpSupported ? 'image/png' : type;
      return new Blob([new Uint8Array(Math.ceil((this.width * this.height) / 100))], {
        type: encodedType,
      });
    }
  };
}

const STORAGE_ORIGIN = 'http://storage.test';
export const UPLOAD_HEADERS = { 'content-type': 'image/webp', 'cache-control': 'max-age=31536000' };

const RATE_LIMIT_MESSAGE = 'Çok fazla deneme yaptınız, lütfen 1 saniye sonra tekrar deneyin';

const STORAGE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT',
  'Access-Control-Allow-Headers': 'content-type, cache-control',
};

type StorageAnswer = 'ok' | 'forbidden';
type CompleteAnswer = 'ok' | 'invalid' | 'notUploaded';

export interface ImageBackendLog {
  /** In arrival order, with the id handed out, since parallel uploads may arrive in any order. */
  reservations: Array<{ id: number; contentType: string; sizeBytes: number }>;
  puts: Array<{ url: string; headers: Headers; size: number }>;
  completes: number[];
  deletes: number[];
  maxParallelPuts: number;
}

interface ImageBackendOptions {
  /** Answers for POST /listing-images in call order; 'rateLimited' is a 429 with Retry-After: 1. */
  reserveAnswers?: Array<'ok' | 'rateLimited'>;
  /** Status of every DELETE; the backend answers 404 once the file is already gone. */
  deleteStatus?: 204 | 404;
  storageAnswers?: StorageAnswer[];
  completeAnswers?: CompleteAnswer[];
  /** Keeps every storage PUT pending until the returned release function is called. */
  holdPuts?: boolean;
}

export function mockImageBackend(options: ImageBackendOptions = {}) {
  const log: ImageBackendLog = {
    reservations: [],
    puts: [],
    completes: [],
    deletes: [],
    maxParallelPuts: 0,
  };
  const putGate = createGate(options.holdPuts ?? false);
  let parallelPuts = 0;
  let nextImageId = 100;
  let reserveCalls = 0;
  server.use(
    mockHttp.post(apiUrl('/listing-images'), async ({ request }) => {
      reserveCalls += 1;
      if (options.reserveAnswers?.[reserveCalls - 1] === 'rateLimited') {
        return HttpResponse.json(buildErrorResponse(429, RATE_LIMIT_MESSAGE), {
          status: 429,
          headers: { 'Retry-After': '1' },
        });
      }
      nextImageId += 1;
      const id = nextImageId;
      const body = (await request.json()) as { contentType: string; sizeBytes: number };
      log.reservations.push({ id, ...body });
      const upload: ImageUpload = {
        id,
        uploadUrl: `${STORAGE_ORIGIN}/listings/${id}.webp?X-Amz-Signature=secret`,
        uploadHeaders: UPLOAD_HEADERS,
        expiresAt: '2026-10-31T10:00:00Z',
      };
      return HttpResponse.json(upload, { status: 201 });
    }),
    // The storage is another origin: like the real bucket, it answers the CORS preflight
    mockHttp.options(
      `${STORAGE_ORIGIN}/listings/:file`,
      () => new HttpResponse(null, { status: 204, headers: STORAGE_CORS_HEADERS }),
    ),
    mockHttp.put(`${STORAGE_ORIGIN}/listings/:file`, async ({ request }) => {
      const answer = options.storageAnswers?.[log.puts.length] ?? 'ok';
      log.puts.push({
        url: request.url,
        headers: request.headers,
        size: (await request.arrayBuffer()).byteLength,
      });
      parallelPuts += 1;
      log.maxParallelPuts = Math.max(log.maxParallelPuts, parallelPuts);
      await putGate.wait();
      parallelPuts -= 1;
      return answer === 'ok'
        ? new HttpResponse(null, { status: 200, headers: STORAGE_CORS_HEADERS })
        : new HttpResponse('<Error><Code>SignatureDoesNotMatch</Code></Error>', {
            status: 403,
            headers: STORAGE_CORS_HEADERS,
          });
    }),
    mockHttp.post(apiUrl('/listing-images/:id/complete'), ({ params }) => {
      const id = Number(params.id);
      const answer = options.completeAnswers?.[log.completes.length] ?? 'ok';
      log.completes.push(id);
      return completeResponse(answer, id);
    }),
    mockHttp.delete(apiUrl('/listing-images/:id'), ({ params }) => {
      log.deletes.push(Number(params.id));
      const status = options.deleteStatus ?? 204;
      return status === 204
        ? new HttpResponse(null, { status })
        : HttpResponse.json(buildErrorResponse(status, 'Görsel bulunamadı'), { status });
    }),
  );
  return { log, releasePuts: putGate.release };
}

function completeResponse(answer: CompleteAnswer, id: number): Response {
  if (answer === 'invalid') {
    return HttpResponse.json(
      { ...buildErrorResponse(422, 'Dosya bildirilen türde değil'), code: 'IMAGE_INVALID' },
      { status: 422 },
    );
  }
  if (answer === 'notUploaded') {
    return HttpResponse.json(
      { ...buildErrorResponse(422, 'Dosya depoda bulunamadı'), code: 'IMAGE_NOT_UPLOADED' },
      { status: 422 },
    );
  }
  return HttpResponse.json({ id, url: `https://cdn.example.com/listings/${id}.webp` });
}

function createGate(closed: boolean) {
  let open = !closed;
  const waiting: Array<() => void> = [];
  return {
    wait: () => (open ? Promise.resolve() : new Promise<void>((resolve) => waiting.push(resolve))),
    release: () => {
      open = true;
      waiting.splice(0).forEach((resolve) => resolve());
    },
  };
}
