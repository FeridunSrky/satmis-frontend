import { z } from 'zod';
import { REPORT_REASONS } from '@/shared/api/enums';

export const MAX_REPORT_DESCRIPTION_LENGTH = 1000;

export const reportSchema = z
  .object({
    reason: z.enum(REPORT_REASONS, { error: 'Bir neden seçin' }),
    description: z
      .string()
      .max(
        MAX_REPORT_DESCRIPTION_LENGTH,
        `Açıklama en fazla ${MAX_REPORT_DESCRIPTION_LENGTH} karakter olabilir`,
      ),
  })
  // "Other" says nothing on its own, so the backend requires the reporter to explain it
  .superRefine((value, context) => {
    if (value.reason === 'OTHER' && !value.description.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['description'],
        message: '"Diğer" seçildiğinde açıklama zorunludur',
      });
    }
  })
  .transform(({ reason, description }) => ({
    reason,
    description: description.trim() || undefined,
  }));
