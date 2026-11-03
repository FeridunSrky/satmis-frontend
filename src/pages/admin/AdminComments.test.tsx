import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AdminComment, ModerationCounts } from '@/features/admin/types';
import { buildAdminComment, errorWithCode, recordJsonPost } from '@/test/commentFixtures';
import { confirmDialog } from '@/test/dialogHelpers';
import { adminUser, testUser } from '@/test/fixtures';
import { buildListingDetail, buildPage } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const NO_COUNTS: ModerationCounts = { pendingListings: 0, pendingComments: 0, reportedListings: 0 };

/** Serves the queue and remembers the query string of every request. */
function mockQueue(comments: AdminComment[]) {
  const queries: string[] = [];
  server.use(
    mockHttp.get(apiUrl('/admin/comments'), ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json(buildPage(comments));
    }),
  );
  return queries;
}

function mockCounts(counts: ModerationCounts) {
  server.use(mockHttp.get(apiUrl('/admin/moderation/counts'), () => HttpResponse.json(counts)));
}

beforeEach(() => {
  signInAs(1, adminUser);
  mockCounts(NO_COUNTS);
});

describe('admin comment queue', () => {
  it('reply_showsTheAnsweredComment_andWarningAboutPersonalData', async () => {
    mockQueue([
      buildAdminComment({
        parent: { id: 21, authorName: 'Ayşe Y.', body: 'Çamurluk boyalı.', status: 'APPROVED' },
      }),
    ]);
    renderApp('/admin/yorumlar');

    const card = await screen.findByRole('article');
    expect(within(card).getByText('İlan sahibinin cevabı')).toBeInTheDocument();
    const parent = within(card).getByRole('region', { name: 'Cevaplanan yorum' });
    expect(parent).toHaveTextContent('Cevaplanan yorum: Ayşe Y.');
    expect(parent).toHaveTextContent('Çamurluk boyalı.');
    expect(within(card).getByText('zeynep@example.com')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ekspertiz\/Belge \(PDF/ })).toHaveAttribute(
      'download',
    );
    expect(screen.getByText(/Eklerde kişisel veri/)).toBeInTheDocument();
  });

  it('approve_sendsReviewedVersionAfterConfirming', async () => {
    mockQueue([buildAdminComment({ id: 51, version: 3 })]);
    const sent = recordJsonPost('/admin/comments/51/approve', () =>
      HttpResponse.json(buildAdminComment({ status: 'APPROVED' })),
    );
    const user = userEvent.setup();
    renderApp('/admin/yorumlar');

    await user.click(await screen.findByRole('button', { name: 'Onayla' }));
    await confirmDialog(user, 'Onayla');

    await waitFor(() => expect(sent).toEqual([{ version: 3 }]));
    expect(await screen.findByText('Yorum onaylandı')).toBeInTheDocument();
  });

  it('reject_requiresReason_thenSendsIt', async () => {
    mockQueue([buildAdminComment({ id: 51, version: 3 })]);
    const sent = recordJsonPost('/admin/comments/51/reject', () =>
      HttpResponse.json(buildAdminComment({ status: 'REJECTED' })),
    );
    const user = userEvent.setup();
    renderApp('/admin/yorumlar');

    await user.click(await screen.findByRole('button', { name: 'Reddet' }));
    const dialog = screen.getByRole('dialog', { name: 'Yorumu reddet' });
    expect(dialog).toHaveTextContent('Yazar bu nedeni görür.');
    await user.click(within(dialog).getByRole('button', { name: 'Reddet' }));
    expect(await within(dialog).findByText('Gerekçe zorunludur')).toBeInTheDocument();
    expect(sent).toEqual([]);

    await user.type(within(dialog).getByLabelText('Gerekçe'), 'Plaka');
    expect(within(dialog).getByText('495 karakter kaldı')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Reddet' }));

    await waitFor(() => expect(sent).toEqual([{ version: 3, reason: 'Plaka' }]));
  });

  it('conflict_saysItChangedAndReloadsQueue', async () => {
    const queries = mockQueue([buildAdminComment({ id: 51 })]);
    recordJsonPost('/admin/comments/51/approve', () =>
      errorWithCode(409, 'Yorum siz incelerken değişti'),
    );
    const user = userEvent.setup();
    renderApp('/admin/yorumlar');

    await user.click(await screen.findByRole('button', { name: 'Onayla' }));
    await confirmDialog(user, 'Onayla');

    expect(await screen.findByText(/Yorum siz incelerken değişti/)).toBeInTheDocument();
    await waitFor(() => expect(queries.length).toBeGreaterThanOrEqual(2));
  });

  it('listingFilterFromUrl_isSentAndShownAsRemovableChip', async () => {
    const queries = mockQueue([buildAdminComment({ status: 'APPROVED' })]);
    const user = userEvent.setup();
    const { router } = renderApp('/admin/yorumlar?status=APPROVED&listingId=7');

    expect(await screen.findByRole('button', { name: 'Yayından kaldır' })).toBeInTheDocument();
    expect(queries[0]).toContain('status=APPROVED');
    expect(queries[0]).toContain('listingId=7');
    expect(screen.getByText('İlan #7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'İlan #7 filtresini kaldır' }));
    await waitFor(() => expect(currentPath(router)).toBe('/admin/yorumlar?status=APPROVED'));
  });

  it('emptyPendingQueue_saysSo', async () => {
    mockQueue([]);
    renderApp('/admin/yorumlar');

    expect(await screen.findByText('Onay bekleyen yorum yok.')).toBeInTheDocument();
  });
});

describe('admin tab badges and access', () => {
  it('tabs_showPendingCounts_andNoBadgeForZero', async () => {
    mockQueue([]);
    mockCounts({ pendingListings: 2, pendingComments: 3, reportedListings: 0 });
    renderApp('/admin/yorumlar');

    const sections = await screen.findByRole('navigation', { name: 'Yönetim bölümleri' });
    expect(
      await within(sections).findByRole('link', { name: 'Yorumlar, 3 bekleyen' }),
    ).toHaveAttribute('href', '/admin/yorumlar');
    expect(within(sections).getByRole('link', { name: 'İlan onayı, 2 bekleyen' })).toBeVisible();
    expect(within(sections).getByRole('link', { name: 'Şikayetler' })).toBeVisible();
  });

  it('listingReview_linksToItsPublishedComments', async () => {
    server.use(
      mockHttp.get(apiUrl('/admin/listings/7'), () => HttpResponse.json(buildListingDetail())),
    );
    renderApp('/admin/ilanlar/7');

    expect(await screen.findByRole('link', { name: 'Bu ilanın yorumları' })).toHaveAttribute(
      'href',
      '/admin/yorumlar?status=APPROVED&listingId=7',
    );
  });

  it('regularUser_cannotOpenTheCommentQueue', async () => {
    signInAs(1, testUser);
    const { router } = renderApp('/admin/yorumlar');

    await waitFor(() => expect(currentPath(router)).toBe('/'));
  });
});
