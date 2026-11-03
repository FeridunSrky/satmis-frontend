import { ImagePicker } from '@/features/listings/form/ImagePicker';
import type { CommentAttachmentsState } from '../hooks/useCommentAttachments';
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS } from './attachmentTarget';
import { AttachmentUploadItem } from './AttachmentUploadItem';

interface AttachmentsFieldProps {
  attachments: CommentAttachmentsState;
}

export function AttachmentsField({ attachments }: AttachmentsFieldProps) {
  const { items } = attachments;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-ink">Ekler (isteğe bağlı)</legend>
      <p className="text-sm text-muted">
        Ekspertiz raporu (PDF) ya da fotoğraf; en fazla {MAX_ATTACHMENTS} dosya, her biri en fazla
        10 MB. Fotoğraflardaki konum bilgisi yüklemeden önce silinir.
      </p>
      <ImagePicker
        onFiles={attachments.addFiles}
        disabled={items.length >= MAX_ATTACHMENTS}
        accept={ATTACHMENT_ACCEPT}
        label="Dosya ekle"
        dropHint="veya dosyaları buraya sürükleyin"
      />
      <p className="text-sm text-muted">
        {items.length}/{MAX_ATTACHMENTS} dosya
      </p>
      {items.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map(
            (item, index) =>
              item.status !== 'existing' && (
                <AttachmentUploadItem
                  key={item.key}
                  item={item}
                  position={index + 1}
                  onRemove={() => attachments.removeImage(item.key)}
                />
              ),
          )}
        </ol>
      )}
    </fieldset>
  );
}
