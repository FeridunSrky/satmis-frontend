import { z } from 'zod';

export const COMMENT_MIN_LENGTH = 20;
export const COMMENT_MAX_LENGTH = 2000;

// The backend trims before counting, so leading and trailing spaces never make a text long enough
export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(COMMENT_MIN_LENGTH, `En az ${COMMENT_MIN_LENGTH} karakter yazın`)
    .max(COMMENT_MAX_LENGTH, `En fazla ${COMMENT_MAX_LENGTH} karakter yazabilirsiniz`),
});
