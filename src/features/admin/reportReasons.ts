import type { ReportReason } from '@/shared/api/enums';
import { REPORT_REASON_LABELS } from '@/shared/config/vehicleLabels';
import type { ReportedListing } from './types';

/** "Dolandırıcılık şüphesi 2 · Yanlış bilgi 1", most frequent reason first. */
export function formatReasonBreakdown(reasons: ReportedListing['reasons']): string {
  return (Object.entries(reasons) as Array<[ReportReason, number]>)
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .map(([reason, count]) => `${REPORT_REASON_LABELS[reason]} ${count}`)
    .join(' · ');
}
