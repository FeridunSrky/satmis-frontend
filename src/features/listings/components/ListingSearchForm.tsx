import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/lib/cn';
import { MAX_KEYWORD_LENGTH, normalizeKeyword } from '../keyword';

const searchSchema = z.object({
  keyword: z
    .string()
    .max(MAX_KEYWORD_LENGTH, `Arama en fazla ${MAX_KEYWORD_LENGTH} karakter olabilir`)
    .transform(normalizeKeyword),
});

interface ListingSearchFormProps {
  /** Keyword currently in the URL; the input follows it on Back/Forward. */
  keyword?: string;
  /** Called on submit only, never while typing; `undefined` means the box was cleared. */
  onSearch: (keyword: string | undefined) => void;
  /** Field error the backend returned for `q`. */
  serverError?: string;
  className?: string;
}

export function ListingSearchForm({
  keyword = '',
  onSearch,
  serverError,
  className,
}: ListingSearchFormProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(searchSchema),
    // `values` resets the input whenever the URL keyword changes, e.g. on Back
    values: { keyword },
  });
  const error = errors.keyword?.message ?? serverError;

  const onSubmit = handleSubmit(({ keyword: nextKeyword }) => {
    // Show the trimmed keyword even when the URL, and so `values`, stays the same
    reset({ keyword: nextKeyword ?? '' });
    onSearch(nextKeyword);
  });

  // <search> is the semantic form of role="search"; the linter rejects the role attribute
  return (
    <search className={className}>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor={inputId} className="sr-only">
          İlanlarda ara
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="search"
            enterKeyHint="search"
            maxLength={MAX_KEYWORD_LENGTH}
            placeholder="Marka, model ya da kelime ara"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-11 w-full min-w-0 rounded-md border bg-paper px-3 text-base outline-none transition-colors',
              'placeholder:text-muted/70 focus:border-brand-600 focus:ring-2 focus:ring-brand-100',
              error ? 'border-danger' : 'border-line hover:border-ink/40',
            )}
            {...register('keyword')}
          />
          <Button type="submit" className="h-11 shrink-0">
            Ara
          </Button>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </form>
    </search>
  );
}
