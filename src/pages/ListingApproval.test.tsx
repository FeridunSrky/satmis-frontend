import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListingStatus } from '@/shared/api/enums';
import type { ListingDetail } from '@/features/listings/types';
import { createTestPhoto, installImageFakes, mockImageBackend } from '@/test/imageMocks';
import {
  buildListingDetail,
  buildListingSummary,
  buildPage,
  mockCatalog,
  ownListingOverrides,
} from '@/test/listingFixtures';
import { fillListingFields, pickPhotos, waitForUploadsToSettle } from '@/test/listingFormHelpers';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const REJECTION_REASON = '<b>Fotoğraflar</b> araca ait değil';
const REVIEW_WARNING =
  'Başlık, açıklama, fiyat veya fotoğraf değişikliği ilanı yeniden onaya gönderir; onaylanana kadar ilan yayında görünmez.';

function ownListing(overrides: Partial<ListingDetail> = {}): ListingDetail {
  return buildListingDetail({ ...ownListingOverrides, ...overrides });
}

function mockDetail(listing: ListingDetail) {
  server.use(mockHttp.get(apiUrl(`/listings/${listing.id}`), () => HttpResponse.json(listing)));
}

/** Detail answers with the stored listing; PUT stores the listing with `statusAfterSave`. */
function mockEditableListing(initial: ListingDetail, statusAfterSave: ListingStatus) {
  let stored = initial;
  server.use(
    mockHttp.get(apiUrl('/listings/7'), () => HttpResponse.json(stored)),
    mockHttp.put(apiUrl('/listings/7'), () => {
      stored = {
        ...stored,
        version: stored.version + 1,
        status: statusAfterSave,
        rejectionReason: null,
      };
      return HttpResponse.json(stored);
    }),
  );
}

async function saveEditForm() {
  const user = userEvent.setup();
  await screen.findByRole('option', { name: '1.0 TCe' });
  await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));
}

beforeEach(() => signInAs(1));
afterEach(() => vi.unstubAllGlobals());

describe('creating a listing', () => {
  beforeEach(() => {
    mockCatalog();
    installImageFakes();
    mockImageBackend();
  });

  it('pendingApprovalAnswer_showsReviewMessageAndPendingDetail', async () => {
    const created = ownListing({ id: 12, status: 'PENDING_APPROVAL' });
    mockDetail(created);
    server.use(
      mockHttp.post(apiUrl('/listings'), () => HttpResponse.json(created, { status: 201 })),
    );
    const { router } = renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });

    await fillListingFields(user);
    await pickPhotos(user, [createTestPhoto(4032, 3024)]);
    await screen.findByRole('img', { name: 'Görsel 1 (kapak)' });
    await waitForUploadsToSettle();
    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));

    expect(
      await screen.findByText('İlanınız alındı, onaylandıktan sonra yayına girecek.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(currentPath(router)).toBe('/ilan/12'));
    expect(await screen.findByText('Onay bekliyor')).toBeInTheDocument();
  });
});

describe('listing detail for the owner', () => {
  it('pendingApproval_showsNoticeAndHidesStatusButtons', async () => {
    mockDetail(ownListing({ status: 'PENDING_APPROVAL' }));
    renderApp('/ilan/7');

    const notice = await screen.findByRole('region', { name: 'Bu ilan onay bekliyor.' });
    expect(notice).toHaveTextContent('Onaylanana kadar sadece siz görebilirsiniz.');
    expect(screen.getByRole('button', { name: 'Sil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Düzenle' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Yayın|Satıldı olarak/ })).not.toBeInTheDocument();
  });

  it('rejected_showsReasonAsTextAndEditLinkOpensForm', async () => {
    mockDetail(ownListing({ status: 'REJECTED', rejectionReason: REJECTION_REASON }));
    const { router } = renderApp('/ilan/7');
    const user = userEvent.setup();

    const notice = await screen.findByRole('region', { name: 'İlanınız yayına alınmadı.' });
    expect(notice).toHaveTextContent(REJECTION_REASON);
    expect(notice.querySelector('b')).toBeNull();
    expect(screen.queryByRole('button', { name: /Yayın|Satıldı olarak/ })).not.toBeInTheDocument();

    await user.click(within(notice).getByRole('link', { name: 'Düzenle' }));

    await waitFor(() => expect(currentPath(router)).toBe('/ilan/7/duzenle'));
  });

  it('activeListing_showsNoApprovalNotice', async () => {
    mockDetail(ownListing());
    renderApp('/ilan/7');

    await screen.findByRole('button', { name: 'Yayından kaldır' });
    expect(screen.queryByRole('region', { name: /onay bekliyor|yayına alınmadı/ })).toBeNull();
  });
});

describe('editing a listing', () => {
  beforeEach(() => {
    mockCatalog();
    installImageFakes();
    mockImageBackend();
  });

  it('activeListing_warnsAndReportsResubmission', async () => {
    mockEditableListing(ownListing(), 'PENDING_APPROVAL');
    const { router } = renderApp('/ilan/7/duzenle');

    expect(await screen.findByText(REVIEW_WARNING)).toBeInTheDocument();
    await saveEditForm();

    expect(await screen.findByText('İlanınız tekrar onaya gönderildi.')).toBeInTheDocument();
    await waitFor(() => expect(currentPath(router)).toBe('/ilan/7'));
    expect(
      await screen.findByRole('region', { name: 'Bu ilan onay bekliyor.' }),
    ).toBeInTheDocument();
  });

  it('activeListingStayingActive_showsPlainSavedMessage', async () => {
    mockEditableListing(ownListing(), 'ACTIVE');
    renderApp('/ilan/7/duzenle');

    await saveEditForm();

    expect(await screen.findByText('İlan güncellendi')).toBeInTheDocument();
    expect(screen.queryByText('İlanınız tekrar onaya gönderildi.')).not.toBeInTheDocument();
  });

  it('rejectedListing_showsReasonAndResubmitsOnSave', async () => {
    mockEditableListing(
      ownListing({ status: 'REJECTED', rejectionReason: REJECTION_REASON }),
      'PENDING_APPROVAL',
    );
    renderApp('/ilan/7/duzenle');

    const notice = await screen.findByRole('region', { name: 'İlanınız yayına alınmadı.' });
    expect(notice).toHaveTextContent(REJECTION_REASON);
    expect(notice).toHaveTextContent('Kaydettiğinizde ilan tekrar onaya gönderilir.');
    expect(screen.queryByText(REVIEW_WARNING)).not.toBeInTheDocument();
    await saveEditForm();

    expect(await screen.findByText('İlanınız tekrar onaya gönderildi.')).toBeInTheDocument();
  });

  it('pendingListingStayingPending_showsPlainSavedMessage', async () => {
    mockEditableListing(ownListing({ status: 'PENDING_APPROVAL' }), 'PENDING_APPROVAL');
    renderApp('/ilan/7/duzenle');

    await saveEditForm();

    expect(await screen.findByText('İlan güncellendi')).toBeInTheDocument();
  });
});

describe('my listings', () => {
  it('newStatuses_showBadgesAndRejectedHint', async () => {
    server.use(
      mockHttp.get(apiUrl('/users/me/listings'), () =>
        HttpResponse.json(
          buildPage([
            buildListingSummary({
              id: 1,
              title: 'Bekleyen ilan başlığı',
              status: 'PENDING_APPROVAL',
            }),
            buildListingSummary({ id: 2, title: 'Reddedilen ilan başlığı', status: 'REJECTED' }),
          ]),
        ),
      ),
    );
    renderApp('/ilanlarim');

    const pendingCard = (
      await screen.findByRole('link', { name: 'Bekleyen ilan başlığı' })
    ).closest('article');
    const rejectedCard = screen
      .getByRole('link', { name: 'Reddedilen ilan başlığı' })
      .closest('article');
    expect(pendingCard).not.toBeNull();
    expect(rejectedCard).not.toBeNull();
    expect(within(pendingCard!).getByText('Onay bekliyor')).toBeInTheDocument();
    expect(within(rejectedCard!).getByText('Reddedildi')).toBeInTheDocument();
    expect(within(rejectedCard!).getByText('Nedenini görmek için tıklayın')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Yayın|Satıldı olarak/ })).not.toBeInTheDocument();
  });
});
