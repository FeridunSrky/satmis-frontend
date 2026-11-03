import type { ListingImageItem } from '@/features/listings/images/listingImageItems';
import { UploadStatus } from '@/features/listings/form/UploadStatus';
import { Button } from '@/shared/components/Button';
import { formatFileSize } from '@/shared/lib/format';
import { PDF_CONTENT_TYPE } from './attachmentTarget';
import { FileIcon } from './FileIcon';

interface AttachmentUploadItemProps {
  item: Exclude<ListingImageItem, { status: 'existing' }>;
  position: number;
  onRemove: () => void;
}

/** One picked file in the comment form: a thumbnail, or a PDF's name and size. */
export function AttachmentUploadItem({ item, position, onRemove }: AttachmentUploadItemProps) {
  const isPdf = item.file.type === PDF_CONTENT_TYPE;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-line p-2">
      {isPdf ? (
        <div className="flex items-center gap-2 rounded-md bg-surface p-3">
          <FileIcon />
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold">{item.file.name}</p>
            <p className="text-muted">PDF, {formatFileSize(item.file.size)}</p>
          </div>
        </div>
      ) : (
        <div className="aspect-[4/3] overflow-hidden rounded-md bg-surface">
          <img
            src={item.previewUrl}
            alt={`Ek ${position}`}
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        </div>
      )}
      <UploadStatus
        item={item}
        progressLabel={`${position}. ek yükleniyor`}
        retryLabel={`${position}. eki tekrar yükle`}
      />
      <Button
        variant="ghost"
        className="h-8 self-start px-2 text-danger hover:bg-danger-soft"
        onClick={onRemove}
        aria-label={`${position}. eki kaldır`}
      >
        Kaldır
      </Button>
    </li>
  );
}
