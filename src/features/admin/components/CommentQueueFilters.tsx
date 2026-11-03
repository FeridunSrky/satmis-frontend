import { COMMENT_STATUSES } from '@/shared/api/enums';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { COMMENT_FILTER_LABELS, type CommentQueueFilter } from '../commentQueueParams';

const STATUS_OPTIONS = COMMENT_STATUSES.map((status) => ({
  value: status,
  label: COMMENT_FILTER_LABELS[status],
}));

interface CommentQueueFiltersProps {
  filter: CommentQueueFilter;
  onChange: (filter: CommentQueueFilter) => void;
}

export function CommentQueueFilters({ filter, onChange }: CommentQueueFiltersProps) {
  const selectStatus = (value: string) => {
    const status = COMMENT_STATUSES.find((candidate) => candidate === value);
    if (status) {
      onChange({ ...filter, status });
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filter.listingId !== null && (
        <p className="inline-flex h-10 items-center gap-1 rounded-full bg-brand-50 pr-1 pl-3 text-sm font-semibold text-brand-700">
          İlan #{filter.listingId}
          <Button
            variant="ghost"
            className="h-8 px-2"
            aria-label={`İlan #${filter.listingId} filtresini kaldır`}
            onClick={() => onChange({ ...filter, listingId: null })}
          >
            ×
          </Button>
        </p>
      )}
      <SelectField
        label="Durum"
        className="w-full sm:w-56"
        options={STATUS_OPTIONS}
        value={filter.status}
        onChange={(event) => selectStatus(event.target.value)}
      />
    </div>
  );
}
