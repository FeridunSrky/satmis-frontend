import { useEffect, useReducer, useRef, type Dispatch } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import { prepareImage, type PreparedImage } from '@/shared/lib/prepareImage';
import { deleteImageUpload } from '../api/listingImagesApi';
import { toUploadFailure } from '../images/imageUploadFailure';
import {
  listingImagesReducer,
  toImageIds,
  type ListingImageAction,
  type ListingImageItem,
} from '../images/listingImageItems';
import { runImageUpload } from '../images/runImageUpload';
import { MAX_IMAGES } from '../listingLimits';

const MAX_PARALLEL_UPLOADS = 3;

export interface ExistingImage {
  id: number;
  url: string;
}

/** What only this tab knows about a picked file; the rendered state lives in the reducer. */
interface PendingUpload {
  file: File;
  previewUrl: string;
  controller: AbortController;
  prepared?: Promise<PreparedImage>;
  imageId?: number;
}

let nextKey = 0;

function toExistingItems(images: ExistingImage[]): ListingImageItem[] {
  return images.map((image) => ({ key: `existing-${image.id}`, status: 'existing', ...image }));
}

/** Uploads picked photos right away and tracks order, cover and removals for the listing form. */
export function useListingImages(initialImages: ExistingImage[] = []) {
  const [items, dispatch] = useReducer(listingImagesReducer, initialImages, toExistingItems);
  const queue = useUploadQueue(dispatch);

  const addFiles = (files: File[]) => {
    const accepted = files.slice(0, Math.max(0, MAX_IMAGES - items.length));
    if (accepted.length < files.length) {
      toast.info(`En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz; fazlası eklenmedi.`);
    }
    const added = accepted.map((file) => queue.track(`upload-${(nextKey += 1)}`, file));
    dispatch({ type: 'added', items: added });
    added.forEach((item) => queue.enqueue(item.key));
  };

  const moveImage = (key: string, offset: number) => {
    const index = items.findIndex((item) => item.key === key);
    dispatch({ type: 'moved', key, toIndex: index + offset });
  };

  return {
    items,
    imageIds: toImageIds(items),
    isUploading: items.some((item) => item.status === 'preparing' || item.status === 'uploading'),
    hasFailedImages: items.some((item) => item.status === 'error'),
    addFiles,
    moveImage,
    makeCover: (key: string) => dispatch({ type: 'moved', key, toIndex: 0 }),
    // An existing image is only dropped from the list: the backend detaches it on save (DELETE is 409)
    removeImage: (key: string) => {
      queue.forget(key);
      dispatch({ type: 'removed', key });
    },
  };
}

function useUploadQueue(dispatch: Dispatch<ListingImageAction>) {
  const uploads = useRef(new Map<string, PendingUpload>());
  const waiting = useRef<string[]>([]);
  const running = useRef(0);

  useEffect(() => {
    const pending = uploads.current;
    return () => {
      pending.forEach((upload) => release(upload));
      pending.clear();
      waiting.current = [];
    };
  }, []);

  const startNext = () => {
    while (running.current < MAX_PARALLEL_UPLOADS) {
      const key = waiting.current.shift();
      if (key === undefined) {
        return;
      }
      running.current += 1;
      void upload(key).finally(() => {
        running.current -= 1;
        startNext();
      });
    }
  };

  const enqueue = (key: string) => {
    waiting.current.push(key);
    startNext();
  };

  const upload = async (key: string) => {
    const pending = uploads.current.get(key);
    if (!pending) {
      return;
    }
    const controller = new AbortController();
    pending.controller = controller;
    dispatch({ type: 'started', key, status: 'preparing' });
    try {
      const image = await runImageUpload({
        prepare: () => (pending.prepared ??= prepareOnce(pending)),
        onUploadStarted: () => dispatch({ type: 'started', key, status: 'uploading' }),
        onProgress: (progress) => dispatch({ type: 'progressed', key, progress }),
        onReserved: (imageId) => (pending.imageId = imageId),
        signal: controller.signal,
      });
      dispatch({ type: 'uploaded', key, id: image.id, url: image.url });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const failure = toUploadFailure(error);
      const retry = failure.retryable ? () => retryUpload(key) : undefined;
      dispatch({ type: 'failed', key, message: failure.message, retry });
    }
  };

  // Starts over with a new upload URL; the old reservation is of no use any more
  const retryUpload = (key: string) => {
    const pending = uploads.current.get(key);
    if (pending?.imageId !== undefined) {
      discardImage(pending.imageId);
      pending.imageId = undefined;
    }
    dispatch({ type: 'started', key, status: 'preparing' });
    enqueue(key);
  };

  return {
    enqueue,
    track: (key: string, file: File): ListingImageItem => {
      const previewUrl = URL.createObjectURL(file);
      uploads.current.set(key, { file, previewUrl, controller: new AbortController() });
      return { key, status: 'preparing', previewUrl, progress: 0 };
    },
    forget: (key: string) => {
      const pending = uploads.current.get(key);
      if (!pending) {
        return;
      }
      release(pending);
      if (pending.imageId !== undefined) {
        discardImage(pending.imageId);
      }
      uploads.current.delete(key);
      waiting.current = waiting.current.filter((waitingKey) => waitingKey !== key);
    },
  };
}

function prepareOnce(pending: PendingUpload): Promise<PreparedImage> {
  return prepareImage(pending.file).catch((error: unknown) => {
    // Not cached when it failed, so a retry gets a fresh attempt
    pending.prepared = undefined;
    throw error;
  });
}

function release(pending: PendingUpload) {
  pending.controller.abort();
  URL.revokeObjectURL(pending.previewUrl);
}

// Unused uploads expire on the backend after 24 h, so a failed DELETE only delays the cleanup
function discardImage(imageId: number) {
  deleteImageUpload(imageId).catch((error: unknown) => {
    const apiError = toApiError(error);
    const reason = apiError.kind === 'http' ? `HTTP ${apiError.status}` : 'network error';
    console.warn(`Discarding uploaded image ${imageId} failed (${reason}).`);
  });
}
