import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingDetail } from '@/features/listings/types';
import { adminUser, buildErrorResponse } from '@/test/fixtures';
import { buildListingDetail, buildListingSummary, buildPage } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

type QueryLog = Array<Record<string, string>>;

function mockQueue(): QueryLog {
  const queries: QueryLog = [];
  server.use(
    mockHttp.get(apiUrl('/admin/listings'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(buildPage([buildListingSummary({ status: 'PENDING_APPROVAL' })]));
    }),
  );
  return queries;
}

/** Serves the detail from a mutable value and counts how often it is fetched. */
function mockReviewedListing(initial: Partial<ListingDetail>) {
  const state = { listing: buildListingDetail(initial), detailRequests: 0 };
  server.use(
    mockHttp.get(apiUrl('/admin/listings/7'), () => {
      state.detailRequests += 1;
      return HttpResponse.json(state.listing);
    }),
  );
  return state;
}

function recordDecision(path: 'approve' | 'reject', answer: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    mockHttp.post(apiUrl(`/admin/listings/7/${path}`), async ({ request }) => {
      bodies.push(await request.json());
      return answer();
    }),
  );
  return bodies;
}

beforeEach(() => signInAs(1, adminUser));

describe('admin listing queue', () => {
  it('defaultsToPendingApproval_andStatusChangeUpdatesUrlAndRequest', async () => {
    const queries = mockQueue();
    const { router } = renderApp('/admin/ilanlar');
    const user = userEvent.setup();

    await waitFor(() =>
      expect(queries.at(-1)).toEqual({ status: 'PENDING_APPROVAL', page: '0', size: '20' }),
    );
    const card = await screen.findByRole('link', { name: 'Hatasız 2019 Clio, bakımları yeni' });
    expect(card).toHaveAttribute('href', '/admin/ilanlar/7');

    await user.selectOptions(screen.getByLabelText('Durum'), 'Reddedildi');

    await waitFor(() => expect(currentPath(router)).toBe('/admin/ilanlar?durum=reddedildi'));
    await waitFor(() => expect(queries.at(-1)).toMatchObject({ status: 'REJECTED', page: '0' }));
  });
});

describe('admin listing review', () => {
  it('approve_sendsLoadedVersion_andReturnsToQueue', async () => {
    mockQueue();
    mockReviewedListing({ status: 'PENDING_APPROVAL', version: 4 });
    const bodies = recordDecision('approve', () =>
      HttpResponse.json(buildListingDetail({ status: 'ACTIVE', version: 5 })),
    );
    const { router } = renderApp('/admin/ilanlar/7');
    const user = userEvent.setup();

    expect(await screen.findByText('Mehmet Kaya')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Onayla' }));

    await waitFor(() => expect(currentPath(router)).toBe('/admin/ilanlar'));
    expect(bodies).toEqual([{ version: 4 }]);
    expect(await screen.findByText('İlan onaylandı')).toBeInTheDocument();
  });

  it('approveConflict_showsMessage_reloadsDetail_andSendsNewVersionNextTime', async () => {
    const state = mockReviewedListing({ status: 'PENDING_APPROVAL', version: 4 });
    const bodies = recordDecision('approve', () => {
      state.listing = { ...state.listing, version: 5, title: 'Sahibi başlığı değiştirdi' };
      return HttpResponse.json(buildErrorResponse(409, 'İlan siz incelerken değişti'), {
        status: 409,
      });
    });
    const { router } = renderApp('/admin/ilanlar/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Onayla' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'İlan siz incelerken değişti. Güncel hali yüklendi, lütfen tekrar inceleyin.',
    );
    expect(
      await screen.findByRole('heading', { name: 'Sahibi başlığı değiştirdi' }),
    ).toBeInTheDocument();
    expect(state.detailRequests).toBe(2);
    expect(currentPath(router)).toBe('/admin/ilanlar/7');

    await user.click(screen.getByRole('button', { name: 'Onayla' }));
    await waitFor(() => expect(bodies).toEqual([{ version: 4 }, { version: 5 }]));
  });

  it('reject_requiresReason_thenSendsVersionAndReason', async () => {
    mockQueue();
    mockReviewedListing({ status: 'PENDING_APPROVAL', version: 4 });
    const bodies = recordDecision('reject', () =>
      HttpResponse.json(buildListingDetail({ status: 'REJECTED' })),
    );
    const { router } = renderApp('/admin/ilanlar/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Reddet' }));
    const dialog = screen.getByRole('dialog', { name: 'İlanı reddet' });
    expect(within(dialog).getByLabelText('Gerekçe')).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Reddet' }));

    expect(await within(dialog).findByText('Gerekçe zorunludur')).toBeInTheDocument();
    expect(bodies).toEqual([]);

    await user.type(within(dialog).getByLabelText('Gerekçe'), 'Fotoğraflar araca ait değil');
    await user.click(within(dialog).getByRole('button', { name: 'Reddet' }));

    await waitFor(() => expect(currentPath(router)).toBe('/admin/ilanlar'));
    expect(bodies).toEqual([{ version: 4, reason: 'Fotoğraflar araca ait değil' }]);
  });

  it('rejectDialog_closesOnEscape_andReturnsFocus', async () => {
    mockReviewedListing({ status: 'PENDING_APPROVAL' });
    renderApp('/admin/ilanlar/7');
    const user = userEvent.setup();
    const rejectButton = await screen.findByRole('button', { name: 'Reddet' });

    await user.click(rejectButton);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rejectButton).toHaveFocus();
  });

  it('activeListing_offersOnlyUnpublish', async () => {
    mockReviewedListing({ status: 'ACTIVE' });
    renderApp('/admin/ilanlar/7');

    expect(await screen.findByRole('button', { name: 'Yayından kaldır' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Onayla' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reddet' })).not.toBeInTheDocument();
  });

  it('rejectedListing_showsReason_andNoDecisionButtons', async () => {
    mockReviewedListing({ status: 'REJECTED', rejectionReason: 'Fiyat gerçekçi değil' });
    renderApp('/admin/ilanlar/7');

    expect(await screen.findByText('Fiyat gerçekçi değil')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Onayla|Reddet|Yayından kaldır/ })).toBeNull();
  });
});
