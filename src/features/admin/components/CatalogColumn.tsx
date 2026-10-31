import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CatalogItem } from '@/shared/api/types';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/lib/cn';

interface CatalogColumnProps {
  title: string;
  /** Shown instead of the list while the parent is not chosen yet. */
  placeholder?: string;
  query: UseQueryResult<CatalogItem[]>;
  selectedId?: number;
  /** Items are only selectable when the next column depends on them. */
  onSelect?: (item: CatalogItem) => void;
  children?: ReactNode;
}

export function CatalogColumn({
  title,
  placeholder,
  query,
  selectedId,
  onSelect,
  children,
}: CatalogColumnProps) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4"
    >
      <h3 className="font-semibold">{title}</h3>
      {placeholder ? (
        <p className="text-sm text-muted">{placeholder}</p>
      ) : (
        <CatalogList query={query} selectedId={selectedId} onSelect={onSelect} />
      )}
      {children}
    </section>
  );
}

type CatalogListProps = Pick<CatalogColumnProps, 'query' | 'selectedId' | 'onSelect'>;

function CatalogList({ query, selectedId, onSelect }: CatalogListProps) {
  if (query.isPending) {
    return <output className="text-sm text-muted">Yükleniyor...</output>;
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2 text-sm text-danger">
        Liste yüklenemedi.
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Tekrar dene
        </Button>
      </div>
    );
  }
  if (query.data.length === 0) {
    return <p className="text-sm text-muted">Henüz kayıt yok.</p>;
  }
  return (
    <ul className="max-h-80 overflow-y-auto">
      {query.data.map((item) => (
        <li key={item.id}>
          {onSelect ? (
            <button
              type="button"
              aria-pressed={item.id === selectedId}
              onClick={() => onSelect(item)}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left text-sm',
                item.id === selectedId
                  ? 'bg-brand-50 font-semibold text-brand-700'
                  : 'hover:bg-surface',
              )}
            >
              {item.name}
            </button>
          ) : (
            <span className="block px-3 py-2 text-sm">{item.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
