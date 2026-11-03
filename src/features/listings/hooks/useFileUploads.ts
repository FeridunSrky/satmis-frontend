import { useEffect, useReducer, useRef, type Dispatch } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/apiError';
import { rateLimitWaitSeconds, toUploadFailure } from '../images/imageUploadFailure';
import {
  listingImagesReducer,
  toImageIds,
  type ListingImageAction,
  type ListingImageItem,
} from '../images/listingImageItems';
import { runImageUpload } from '../images/runImageUpload';
import type { PreparedUpload, UploadTarget } from '../images/uploadTarget';

const MAX_PARALLEL_UPLOADS = 3;
const HTTP_NOT_FOUND = 404;
const MS_PER_SECOND = 1000;

export interface ExistingImage {
  id: number;
  url: string;
}

/** What only this tab knows about a picked file; the rendered state lives in the reducer. */
interface PendingUpload<TContentType extends string> {
  file: File;
  previewUrl: string;
  controller: AbortController;
  prepared?: Promise<PreparedUpload<TContentType>>;
  fileId?: number;
}

let nextKey = 0;

function toExistingItems(images: ExistingImage[]): ListingImageItem[] {
  return images.map((image) => ({ key: `existing-${image.id}`, status: 'existing', ...image }));
}

/** Uploads picked files right away and tracks order and removals for the form they belong to. */
export function useFileUploads<TContentType extends string>(
  target: UploadTarget<TContentType>,
  initialFiles: ExistingImage[] = [],
) {
  const [items, dispatch] = useReducer(listingImagesReducer, initialFiles, toExistingItems);
  const queue = useUploadQueue(target, dispatch);

  const addFiles = (files: File[]) => {
    const accepted = files.slice(0, Math.max(0, target.maxFiles - items.length));
    if (accepted.length < files.length) {
      toast.info(target.tooManyFilesMessage);
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
      queue.forget(key, { discard: true });
      dispatch({ type: 'removed', key });
    },
    /**
     * Empties the list. `discard` deletes the uploaded files too; leave it off once they were
     * saved with the form, since they now belong to it (a DELETE would be refused).
     */
    clear: ({ discard }: { discard: boolean }) => {
      queue.forgetAll({ discard });
      dispatch({ type: 'cleared' });
    },
  };
}

function useUploadQueue<TContentType extends string>(
  target: UploadTarget<TContentType>,
  dispatch: Dispatch<ListingImageAction>,
) {
  const uploads = useRef(new Map<string, PendingUpload<TContentType>>());
  const waiting = useRef<string[]>([]);
  const running = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const pending = uploads.current;
    return () => {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = undefined;
      pending.forEach((upload) => release(upload));
      pending.clear();
      waiting.current = [];
    };
  }, []);

  const startNext = () => {
    while (running.current < MAX_PARALLEL_UPLOADS && resumeTimer.current === undefined) {
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
      const uploaded = await runImageUpload(target, {
        prepare: () => (pending.prepared ??= prepareOnce(target, pending)),
        onUploadStarted: () => dispatch({ type: 'started', key, status: 'uploading' }),
        onProgress: (progress) => dispatch({ type: 'progressed', key, progress }),
        onReserved: (fileId) => (pending.fileId = fileId),
        signal: controller.signal,
      });
      dispatch({ type: 'uploaded', key, id: uploaded.id, url: uploaded.url });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const waitSeconds = rateLimitWaitSeconds(error);
      if (waitSeconds !== undefined) {
        waitAndRetryFirst(key, waitSeconds);
        return;
      }
      const failure = toUploadFailure(error, target);
      const retry = failure.retryable ? () => retryUpload(key) : undefined;
      dispatch({ type: 'failed', key, message: failure.message, retry });
    }
  };

  // The upload-URL limit is per user, so every queued file waits, not just this one
  const waitAndRetryFirst = (key: string, waitSeconds: number) => {
    waiting.current.unshift(key);
    dispatch({ type: 'started', key, status: 'preparing' });
    if (resumeTimer.current !== undefined) {
      return;
    }
    toast.info(target.rateLimitedMessage(waitSeconds));
    resumeTimer.current = setTimeout(() => {
      resumeTimer.current = undefined;
      startNext();
    }, waitSeconds * MS_PER_SECOND);
  };

  // Starts over with a new upload URL; the old reservation is of no use any more
  const retryUpload = (key: string) => {
    const pending = uploads.current.get(key);
    if (pending?.fileId !== undefined) {
      discardFile(target, pending.fileId);
      pending.fileId = undefined;
    }
    dispatch({ type: 'started', key, status: 'preparing' });
    enqueue(key);
  };

  const forget = (key: string, { discard }: { discard: boolean }) => {
    const pending = uploads.current.get(key);
    if (!pending) {
      return;
    }
    release(pending);
    if (discard && pending.fileId !== undefined) {
      discardFile(target, pending.fileId);
    }
    uploads.current.delete(key);
    waiting.current = waiting.current.filter((waitingKey) => waitingKey !== key);
  };

  return {
    enqueue,
    track: (key: string, file: File): ListingImageItem => {
      const previewUrl = URL.createObjectURL(file);
      uploads.current.set(key, { file, previewUrl, controller: new AbortController() });
      const picked = { name: file.name, type: file.type, size: file.size };
      return { key, status: 'preparing', previewUrl, file: picked, progress: 0 };
    },
    forget,
    forgetAll: (options: { discard: boolean }) =>
      [...uploads.current.keys()].forEach((key) => forget(key, options)),
  };
}

function prepareOnce<TContentType extends string>(
  target: UploadTarget<TContentType>,
  pending: PendingUpload<TContentType>,
): Promise<PreparedUpload<TContentType>> {
  return target.prepare(pending.file).catch((error: unknown) => {
    // Not cached when it failed, so a retry gets a fresh attempt
    pending.prepared = undefined;
    throw error;
  });
}

function release<TContentType extends string>(pending: PendingUpload<TContentType>) {
  pending.controller.abort();
  URL.revokeObjectURL(pending.previewUrl);
}

// Unused uploads expire on the backend after 24 h, so a failed DELETE only delays the cleanup
function discardFile<TContentType extends string>(
  target: UploadTarget<TContentType>,
  fileId: number,
) {
  target.discard(fileId).catch((error: unknown) => {
    const apiError = toApiError(error);
    // The backend drops the record once the file is gone, so a repeated DELETE is a 404: done
    if (apiError.kind === 'http' && apiError.status === HTTP_NOT_FOUND) {
      return;
    }
    const reason = apiError.kind === 'http' ? `HTTP ${apiError.status}` : 'network error';
    console.warn(`Discarding uploaded file ${fileId} failed (${reason}).`);
  });
}
