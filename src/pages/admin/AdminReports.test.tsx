import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AdminListingReport, ReportedListing } from '@/features/admin/types';
import type { ListingDetail } from '@/features/listings/types';
import { adminUser, buildErrorResponse } from '@/test/fixtures';
import { buildListingDetail, buildListingSummary, buildPage } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

function buildReportedListing(): ReportedListing {
  return {
    listing: buildListingSummary({ status: 'ACTIVE' }),
    openReportCount: 3,
    reasons: { WRONG_INFO: 1, FRAUD_SUSPECTED: 2 },
    firstReportedAt: '2026-10-29T08:00:00Z',
    lastReportedAt: '2026-10-30T12:15:00Z',
  };
}

function buildReport(overrides: Partial<AdminListingReport> = {}): AdminListingReport {
  return {
    id: 11,
    reason: 'FRAUD_SUSPECTED',
    description: 'Kapora istiyor',
    status: 'OPEN',
    reporter: { id: 5, firstName: 'Zeynep', lastName: 'Demir', email: 'zeynep@example.com' },
    createdAt: '2026-10-30T12:15:00Z',
    resolvedAt: null,
    ...overrides,
  };
}

function mockQueue(entries: ReportedListing[]) {
  server.use(mockHttp.get(apiUrl('/admin/reports'), () => HttpResponse.json(buildPage(entries))));
}

/** Serves the reviewed listing and its reports; counts detail fetches. */
function mockReview(listing: Partial<ListingDetail>, reports = [buildReport()]) {
  const state = { listing: buildListingDetail(listing), detailRequests: 0 };
  server.use(
    mockHttp.get(apiUrl('/admin/listings/7'), () => {
      state.detailRequests += 1;
      return HttpResponse.json(state.listing);
    }),
    mockHttp.get(apiUrl('/admin/reports/listings/7'), () => HttpResponse.json(buildPage(reports))),
  );
  return state;
}

function recordPost(path: string, answer: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    mockHttp.post(apiUrl(path), async ({ request }) => {
      bodies.push(await request.text());
      return answer();
    }),
  );
  return bodies;
}

beforeEach(() => signInAs(1, adminUser));

describe('admin report queue', () => {
  it('showsCountReasonsAndLink', async () => {
    mockQueue([buildReportedListing()]);
    renderApp('/admin/sikayetler');

    expect(await screen.findByText('3 açık şikayet')).toBeInTheDocument();
    expect(
      screen.getByText('Dolandırıcılık şüphesi 2 · Yanlış bilgi (fiyat, km vb.) 1'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hatasız 2019 Clio, bakımları yeni' })).toHaveAttribute(
      'href',
      '/admin/sikayetler/7',
    );
    const sections = screen.getByRole('navigation', { name: 'Yönetim bölümleri' });
    expect(within(sections).getByRole('link', { name: 'Şikayetler' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('empty_showsNothingToReview', async () => {
    mockQueue([]);
    renderApp('/admin/sikayetler');

    expect(await screen.findByText('İncelenecek şikayet yok.')).toBeInTheDocument();
  });

  it('regularUser_isSentHome', async () => {
    signInAs(1);
    const { router } = renderApp('/admin/sikayetler');

    await waitFor(() => expect(currentPath(router)).toBe('/'));
  });
});

describe('admin report review', () => {
  it('showsReports_andDismissAfterConfirmation', async () => {
    mockQueue([]);
    mockReview({ status: 'ACTIVE' }, [
      buildReport(),
      buildReport({
        id: 3,
        reason: 'WRONG_INFO',
        description: null,
        status: 'DISMISSED',
        reporter: { id: 6, firstName: 'Ali', lastName: 'Can', email: 'ali@example.com' },
      }),
    ]);
    const dismissCalls = recordPost(
      '/admin/reports/listings/7/dismiss',
      () => new HttpResponse(null, { status: 204 }),
    );
    const { router } = renderApp('/admin/sikayetler/7');
    const user = userEvent.setup();

    const reports = within(await screen.findByRole('region', { name: 'Şikayetler' }));
    expect(await reports.findByText('Kapora istiyor')).toBeInTheDocument();
    expect(reports.getByText(/zeynep@example\.com/)).toBeInTheDocument();
    expect(reports.getByText('İnceleniyor')).toBeInTheDocument();
    expect(reports.getByText('Reddedildi (işlem yapılmadı)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Şikayetleri yok say' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('İlan yayında kalacak, açık şikayetler kapanacak.');
    expect(dismissCalls).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: 'Yok say' }));

    await waitFor(() => expect(currentPath(router)).toBe('/admin/sikayetler'));
    expect(dismissCalls).toHaveLength(1);
  });

  it('takeDown_sendsReasonAndReviewedVersion', async () => {
    mockQueue([]);
    mockReview({ status: 'ACTIVE', version: 3 });
    const bodies = recordPost('/admin/reports/listings/7/take-down', () =>
      HttpResponse.json(buildListingDetail({ status: 'REJECTED', version: 4 })),
    );
    const { router } = renderApp('/admin/sikayetler/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'İlanı kaldır' }));
    const dialog = screen.getByRole('dialog', { name: 'İlanı kaldır' });
    await user.type(
      within(dialog).getByLabelText('Gerekçe'),
      'Dolandırıcılık şikayetleri doğrulandı',
    );
    await user.click(within(dialog).getByRole('button', { name: 'İlanı kaldır' }));

    await waitFor(() => expect(currentPath(router)).toBe('/admin/sikayetler'));
    expect(bodies.map((body) => JSON.parse(String(body)))).toEqual([
      { version: 3, reason: 'Dolandırıcılık şikayetleri doğrulandı' },
    ]);
    expect(await screen.findByText('İlan kaldırıldı')).toBeInTheDocument();
  });

  it('passiveListing_offersOnlyDismiss', async () => {
    mockReview({ status: 'PASSIVE' });
    renderApp('/admin/sikayetler/7');

    expect(await screen.findByRole('button', { name: 'Şikayetleri yok say' })).toBeInTheDocument();
    expect(screen.getByText('İlan yayında olmadığı için kaldırılamaz.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'İlanı kaldır' })).not.toBeInTheDocument();
  });

  it('takeDownConflict_showsMessageAndReloads', async () => {
    const state = mockReview({ status: 'ACTIVE', version: 3 });
    recordPost('/admin/reports/listings/7/take-down', () => {
      state.listing = { ...state.listing, version: 4, title: 'Sahibi başlığı değiştirdi' };
      return HttpResponse.json(buildErrorResponse(409, 'İlan siz incelerken değişti'), {
        status: 409,
      });
    });
    const { router } = renderApp('/admin/sikayetler/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'İlanı kaldır' }));
    const dialog = screen.getByRole('dialog', { name: 'İlanı kaldır' });
    await user.type(within(dialog).getByLabelText('Gerekçe'), 'Sahte ilan');
    await user.click(within(dialog).getByRole('button', { name: 'İlanı kaldır' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'İlan siz incelerken değişti. Güncel hali yüklendi, lütfen tekrar inceleyin.',
    );
    expect(
      await screen.findByRole('heading', { name: 'Sahibi başlığı değiştirdi' }),
    ).toBeInTheDocument();
    expect(state.detailRequests).toBe(2);
    expect(currentPath(router)).toBe('/admin/sikayetler/7');
  });
});
