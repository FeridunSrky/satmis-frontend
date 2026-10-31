import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';

interface FormDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), textarea, input, select, a[href]';

/**
 * Modal for short forms: focuses the first field, keeps Tab inside, closes on Escape and
 * returns focus to the control that opened it.
 */
export function FormDialog({ isOpen, title, description, onClose, children }: FormDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDialogElement>(null);
  // An effect event reads the latest onClose without re-running the effect, which would
  // otherwise move focus back to the first field on every render
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'Tab') {
        keepFocusInside(event, panelRef.current);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      opener?.focus();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-asphalt/60 p-4">
      {/* Rendered open rather than via showModal(): the backdrop and focus handling are ours */}
      <dialog
        open
        ref={panelRef}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="static m-0 w-full max-w-lg rounded-2xl bg-paper p-6 text-ink shadow-xl"
      >
        <h2 id={titleId} className="font-display text-2xl font-bold">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2 text-muted">
            {description}
          </p>
        )}
        <div className="mt-5">{children}</div>
      </dialog>
    </div>
  );
}

function keepFocusInside(event: KeyboardEvent, panel: HTMLElement | null) {
  const focusable = panel ? [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) {
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
