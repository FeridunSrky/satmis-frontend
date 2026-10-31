import { useId, useState, type ChangeEvent, type DragEvent } from 'react';
import { cn } from '@/shared/lib/cn';

// image/* as well, so a phone's photo picker offers everything; prepareImage rejects what it cannot read
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/*';

interface ImagePickerProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

/** A labelled file input that also accepts dropped files; the input stays keyboard-focusable. */
export function ImagePicker({ onFiles, disabled = false }: ImagePickerProps) {
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
        accept={ACCEPTED_TYPES}
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
        Görsel seç
      </label>
      <p className="text-sm text-muted">veya fotoğrafları buraya sürükleyin</p>
    </div>
  );
}
