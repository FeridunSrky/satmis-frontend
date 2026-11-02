import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';

/** The text of one confirmation; kept next to the action it belongs to, not in components. */
export interface ConfirmCopy {
  title: string;
  description: string;
  confirmLabel: string;
  /** Danger for actions that hide, delete or block; primary for the rest. */
  tone?: 'danger' | 'primary';
}

interface ConfirmDialogProps extends ConfirmCopy {
  isOpen: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, ...dialogProps }: ConfirmDialogProps) {
  // Mounting per opening resets the double-click guard and remembers the opener for each use
  return isOpen ? <OpenConfirmDialog {...dialogProps} /> : null;
}

function OpenConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = 'danger',
  isConfirming = false,
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, 'isOpen'>) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  // The mutation's pending flag arrives a render late; this blocks a second click before it does
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus the safe choice first so Enter never confirms by accident
    cancelButtonRef.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onCancel]);

  const confirm = () => {
    if (hasConfirmed) {
      return;
    }
    setHasConfirmed(true);
    onConfirm();
  };
  const isBusy = isConfirming || hasConfirmed;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-asphalt/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-xl"
      >
        <h2 id={titleId} className="font-display text-2xl font-bold">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button ref={cancelButtonRef} variant="secondary" onClick={onCancel}>
            Vazgeç
          </Button>
          <Button variant={tone} onClick={confirm} disabled={isBusy}>
            {isBusy ? 'Gönderiliyor...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
