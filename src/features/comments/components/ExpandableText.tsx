import { useState } from 'react';

const PREVIEW_LENGTH = 280;

/** Plain text that is cut after a few lines' worth of characters, with a "devamı" toggle. */
export function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > PREVIEW_LENGTH;
  const shown = isLong && !isExpanded ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;

  return (
    <div>
      <p className="whitespace-pre-line text-ink/90">{shown}</p>
      {isLong && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="mt-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          {isExpanded ? 'daha az' : 'devamı'}
        </button>
      )}
    </div>
  );
}
