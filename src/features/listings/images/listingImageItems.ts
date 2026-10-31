export type ListingImageItem =
  /** Already attached to the listing being edited. */
  | { key: string; status: 'existing'; id: number; url: string }
  | { key: string; status: 'preparing' | 'uploading'; previewUrl: string; progress: number }
  | { key: string; status: 'uploaded'; id: number; url: string; previewUrl: string }
  | {
      key: string;
      status: 'error';
      previewUrl: string;
      message: string;
      /** Absent when trying again cannot help, e.g. the file is not a valid image. */
      retry?: () => void;
    };

export type ListingImageAction =
  | { type: 'added'; items: ListingImageItem[] }
  | { type: 'started'; key: string; status: 'preparing' | 'uploading' }
  | { type: 'progressed'; key: string; progress: number }
  | { type: 'uploaded'; key: string; id: number; url: string }
  | { type: 'failed'; key: string; message: string; retry?: () => void }
  | { type: 'removed'; key: string }
  | { type: 'moved'; key: string; toIndex: number };

function hasPreview(
  item: ListingImageItem,
): item is Exclude<ListingImageItem, { status: 'existing' }> {
  return item.status !== 'existing';
}

// Actions for an item that was removed meanwhile (a late progress event) are ignored
export function listingImagesReducer(
  items: ListingImageItem[],
  action: ListingImageAction,
): ListingImageItem[] {
  switch (action.type) {
    case 'added':
      return [...items, ...action.items];
    case 'removed':
      return items.filter((item) => item.key !== action.key);
    case 'moved':
      return moveItem(items, action.key, action.toIndex);
    default:
      return items.map((item) =>
        item.key === action.key && hasPreview(item) ? applyToItem(item, action) : item,
      );
  }
}

function applyToItem(
  item: Exclude<ListingImageItem, { status: 'existing' }>,
  action: Exclude<ListingImageAction, { type: 'added' | 'removed' | 'moved' }>,
): ListingImageItem {
  const { key, previewUrl } = item;
  switch (action.type) {
    case 'started':
      return { key, previewUrl, status: action.status, progress: 0 };
    case 'progressed':
      return item.status === 'uploading' ? { ...item, progress: action.progress } : item;
    case 'uploaded':
      return { key, previewUrl, status: 'uploaded', id: action.id, url: action.url };
    case 'failed':
      return { key, previewUrl, status: 'error', message: action.message, retry: action.retry };
  }
}

function moveItem(items: ListingImageItem[], key: string, toIndex: number): ListingImageItem[] {
  const fromIndex = items.findIndex((item) => item.key === key);
  const moved = items[fromIndex];
  if (!moved || toIndex < 0 || toIndex >= items.length) {
    return items;
  }
  const reordered = items.filter((item) => item.key !== key);
  reordered.splice(toIndex, 0, moved);
  return reordered;
}

/** Ids to save, in display order; images still uploading or failed are left out. */
export function toImageIds(items: ListingImageItem[]): number[] {
  return items.flatMap((item) =>
    item.status === 'existing' || item.status === 'uploaded' ? [item.id] : [],
  );
}
