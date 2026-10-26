import type { ListingStatus } from '@/shared/api/enums';
import { LISTING_STATUS_LABELS } from '@/shared/config/vehicleLabels';
import { cn } from '@/shared/lib/cn';

const statusClassNames: Record<ListingStatus, string> = {
  PENDING_APPROVAL: 'bg-lane/20 text-ink',
  ACTIVE: 'bg-success/10 text-success',
  PASSIVE: 'bg-ink/10 text-muted',
  SOLD: 'bg-asphalt text-white',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        statusClassNames[status],
      )}
    >
      {LISTING_STATUS_LABELS[status]}
    </span>
  );
}
