import { Button } from '@/shared/components/Button';
import type { ListingImageItem } from '../images/listingImageItems';

interface ImageThumbnailProps {
  item: ListingImageItem;
  position: number;
  count: number;
  onMove: (offset: number) => void;
  onMakeCover: () => void;
  onRemove: () => void;
}

export function ImageThumbnail({
  item,
  position,
  count,
  onMove,
  onMakeCover,
  onRemove,
}: ImageThumbnailProps) {
  const isCover = position === 1;
  const source = item.status === 'existing' ? item.url : item.previewUrl;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-line p-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-surface">
        <img
          src={source}
          alt={`Görsel ${position}${isCover ? ' (kapak)' : ''}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
        {isCover && (
          <span className="absolute top-1 left-1 rounded bg-ink px-2 py-0.5 text-xs font-semibold text-white">
            Kapak
          </span>
        )}
      </div>
      <ImageStatus item={item} position={position} />
      <div className="flex flex-wrap gap-1">
        <Button
          variant="ghost"
          className="h-8 px-2"
          disabled={position === 1}
          onClick={() => onMove(-1)}
          aria-label={`${position}. görseli sola taşı`}
        >
          ←
        </Button>
        <Button
          variant="ghost"
          className="h-8 px-2"
          disabled={position === count}
          onClick={() => onMove(1)}
          aria-label={`${position}. görseli sağa taşı`}
        >
          →
        </Button>
        {!isCover && (
          <Button
            variant="ghost"
            className="h-8 px-2"
            onClick={onMakeCover}
            aria-label={`${position}. görseli kapak yap`}
          >
            Kapak yap
          </Button>
        )}
        <Button
          variant="ghost"
          className="h-8 px-2 text-danger hover:bg-danger-soft"
          onClick={onRemove}
          aria-label={`${position}. görseli kaldır`}
        >
          Kaldır
        </Button>
      </div>
    </li>
  );
}

function ImageStatus({ item, position }: { item: ListingImageItem; position: number }) {
  switch (item.status) {
    case 'preparing':
      return <p className="text-xs text-muted">Hazırlanıyor...</p>;
    case 'uploading':
      return (
        <progress
          max={100}
          value={Math.round(item.progress * 100)}
          aria-label={`${position}. görsel yükleniyor`}
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
              aria-label={`${position}. görseli tekrar yükle`}
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
