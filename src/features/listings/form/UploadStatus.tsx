import { Button } from '@/shared/components/Button';
import type { ListingImageItem } from '../images/listingImageItems';

interface UploadStatusProps {
  item: ListingImageItem;
  /** Accessible name of the progress bar, e.g. "1. görsel yükleniyor". */
  progressLabel: string;
  /** Accessible name of the retry button, e.g. "1. görseli tekrar yükle". */
  retryLabel: string;
}

/** Progress, or the error and a retry, of one picked file; nothing once it is uploaded. */
export function UploadStatus({ item, progressLabel, retryLabel }: UploadStatusProps) {
  switch (item.status) {
    case 'preparing':
      return <p className="text-xs text-muted">Hazırlanıyor...</p>;
    case 'uploading':
      return (
        <progress
          max={100}
          value={Math.round(item.progress * 100)}
          aria-label={progressLabel}
          className="h-2 w-full"
        />
      );
    case 'error':
      return (
        <div className="flex flex-col gap-1">
          <p role="alert" className="text-xs font-medium text-danger">
            {item.message}
          </p>
          {item.retry && (
            <Button
              variant="secondary"
              className="h-8 px-2"
              onClick={item.retry}
              aria-label={retryLabel}
            >
              Tekrar dene
            </Button>
          )}
        </div>
      );
    default:
      return null;
  }
}
