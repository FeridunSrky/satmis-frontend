import type { CommentStatus } from '@/shared/api/enums';
import { COMMENT_STATUS_LABELS } from '@/shared/config/vehicleLabels';
import { cn } from '@/shared/lib/cn';

const statusClassNames: Record<CommentStatus, string> = {
  PENDING_APPROVAL: 'bg-brand-50 text-brand-700',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger-soft text-danger',
};

export function CommentStatusBadge({ status }: { status: CommentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        statusClassNames[status],
      )}
    >
      {COMMENT_STATUS_LABELS[status]}
    </span>
  );
}
