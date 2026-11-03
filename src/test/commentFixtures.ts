import { http as mockHttp, HttpResponse } from 'msw/http';
import type { AdminComment } from '@/features/admin/types';
import type { CommentAttachment, ListingComment, MyComment } from '@/features/comments/types';
import { buildErrorResponse } from './fixtures';
import { buildPage } from './listingFixtures';
import { apiUrl, server } from './server';

export const PDF_ATTACHMENT: CommentAttachment = {
  id: 31,
  type: 'PDF',
  url: 'https://cdn.example.com/comments/31.pdf',
  sizeBytes: 1_258_291,
};

export const PHOTO_ATTACHMENT: CommentAttachment = {
  id: 32,
  type: 'WEBP',
  url: 'https://cdn.example.com/comments/32.webp',
  sizeBytes: 240_000,
};

export const LONG_ENOUGH_TEXT = 'Aracı yerinde gördüm, sağ çamurlukta boya var.';

export function buildListingComment(overrides: Partial<ListingComment> = {}): ListingComment {
  return {
    id: 21,
    authorName: 'Ayşe Y.',
    body: 'Aracı yerinde inceledim.\nSağ çamurluk boyalı, ilanda yazmıyor.',
    attachments: [PDF_ATTACHMENT],
    createdAt: '2026-11-01T10:00:00Z',
    reply: null,
    canReply: false,
    ...overrides,
  };
}

export function buildMyComment(overrides: Partial<MyComment> = {}): MyComment {
  return {
    id: 41,
    listingId: 7,
    listingTitle: 'Hatasız 2019 Clio, bakımları yeni',
    parentId: null,
    body: LONG_ENOUGH_TEXT,
    status: 'PENDING_APPROVAL',
    rejectionReason: null,
    attachments: [],
    createdAt: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

export function buildAdminComment(overrides: Partial<AdminComment> = {}): AdminComment {
  return {
    id: 51,
    version: 3,
    listingId: 7,
    listingTitle: 'Hatasız 2019 Clio, bakımları yeni',
    listingStatus: 'ACTIVE',
    author: { id: 5, firstName: 'Zeynep', lastName: 'Demir', email: 'zeynep@example.com' },
    parent: null,
    body: LONG_ENOUGH_TEXT,
    status: 'PENDING_APPROVAL',
    rejectionReason: null,
    attachments: [PDF_ATTACHMENT],
    createdAt: '2026-11-01T10:00:00Z',
    reviewedAt: null,
    ...overrides,
  };
}

export function mockListingComments(comments: ListingComment[], listingId = 7) {
  server.use(
    mockHttp.get(apiUrl(`/listings/${listingId}/comments`), () =>
      HttpResponse.json(buildPage(comments)),
    ),
  );
}

export function mockCommentQuota(remainingComments: number, listingId = 7) {
  server.use(
    mockHttp.get(apiUrl('/users/me/comments/quota'), () =>
      HttpResponse.json({
        listingId,
        maxComments: 2,
        usedComments: 2 - remainingComments,
        remainingComments,
      }),
    ),
  );
}

/** Records the bodies POSTed to `path` and answers each with `answer`. */
export function recordJsonPost(path: string, answer: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    mockHttp.post(apiUrl(path), async ({ request }) => {
      bodies.push(await request.json());
      return answer();
    }),
  );
  return bodies;
}

export function errorWithCode(status: number, message: string, code?: string): Response {
  return HttpResponse.json({ ...buildErrorResponse(status, message), code }, { status });
}
