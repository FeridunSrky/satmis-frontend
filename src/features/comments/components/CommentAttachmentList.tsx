import { formatFileSize } from '@/shared/lib/format';
import type { CommentAttachment } from '../types';

interface CommentAttachmentListProps {
  attachments: CommentAttachment[];
  /** Names the images, e.g. "Yorum eki" → "Yorum eki 1". */
  altPrefix?: string;
}

const linkProps = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Images as thumbnails that open full size; PDFs as download links (the storage forces it). */
export function CommentAttachmentList({
  attachments,
  altPrefix = 'Yorum eki',
}: CommentAttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <li key={attachment.id}>
          {attachment.type === 'PDF' ? (
            <a
              href={attachment.url}
              download
              {...linkProps}
              className="inline-flex h-16 items-center rounded-md border border-line bg-surface px-3 text-sm font-semibold text-brand-700 hover:underline"
            >
              Ekspertiz/Belge (PDF, {formatFileSize(attachment.sizeBytes)})
            </a>
          ) : (
            <a href={attachment.url} {...linkProps} className="block">
              <img
                src={attachment.url}
                alt={`${altPrefix} ${index + 1}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-16 w-20 rounded-md border border-line object-cover"
              />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
