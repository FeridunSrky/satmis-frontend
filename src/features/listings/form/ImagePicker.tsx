import { useId, useState, type ChangeEvent, type DragEvent } from 'react';
import { cn } from '@/shared/lib/cn';

// image/* as well, so a phone's photo picker offers everything; prepareImage rejects what it cannot read
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/*';

interface ImagePickerProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  /** The input's `accept`; defaults to the photo types a listing takes. */
  accept?: string;
  label?: string;
  dropHint?: string;
}

/** A labelled file input that also accepts dropped files; the input stays keyboard-focusable. */
export function ImagePicker({
  onFiles,
  disabled = false,
  accept = ACCEPTED_TYPES,
  label = 'Görsel seç',
  dropHint = 'veya fotoğrafları buraya sürükleyin',
}: ImagePickerProps) {
  const inputId = useId();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(event.target.files ?? []));
    // Lets the same file be picked again after it was removed
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      onFiles(Array.from(event.dataTransfer.files));
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line p-6 text-center',
        isDragOver && 'border-brand-500 bg-brand-50',
      )}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={handleChange}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex h-10 cursor-pointer items-center rounded-md border border-line bg-paper px-4 text-sm font-semibold',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 hover:border-ink/40',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        )}
      >
        {label}
      </label>
      <p className="text-sm text-muted">{dropHint}</p>
    </div>
  );
}
