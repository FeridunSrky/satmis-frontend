import { formatDateTime } from '@/shared/lib/format';
import { formatReasonBreakdown } from '../reportReasons';
import type { ReportedListing } from '../types';

export function ReportSummary({ entry }: { entry: ReportedListing }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-paper p-3 text-sm">
      <p>
        <span className="inline-flex rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
          {entry.openReportCount} açık şikayet
        </span>
      </p>
      <p>{formatReasonBreakdown(entry.reasons)}</p>
      <p className="text-muted">Son şikayet: {formatDateTime(entry.lastReportedAt)}</p>
    </div>
  );
}
