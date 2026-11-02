import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay } from 'msw';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingDetail } from '@/features/listings/types';
import { confirmDialog } from '@/test/dialogHelpers';
import { adminUser } from '@/test/fixtures';
import { createTestPhoto, installImageFakes, mockImageBackend } from '@/test/imageMocks';
import { buildListingDetail, mockCatalog, ownListingOverrides } from '@/test/listingFixtures';
import { fillListingFields, pickPhotos, waitForUploadsToSettle } from '@/test/listingFormHelpers';
import { renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const REVIEW_TEXT = /tekrar admin onayına gidecek/;

function ownListing(overrides: Partial<ListingDetail> = {}): ListingDetail {
  return buildListingDetail({ ...ownListingOverrides, ...overrides });
}

function mockOwnListing(listing: ListingDetail) {
  server.use(mockHttp.get(apiUrl('/listings/7'), () => HttpResponse.json(listing)));
}

/** Records status bodies; `holdMs` keeps the request in flight to observe the busy state. */
function recordStatusChanges(listing: ListingDetail, holdMs = 0) {
  const bodies: unknown[] = [];
  server.use(
    mockHttp.patch(apiUrl('/listings/7/status'), async ({ request }) => {
      bodies.push(await request.json());
      await delay(holdMs);
      return HttpResponse.json({ ...listing, status: 'PASSIVE' });
    }),
  );
  return bodies;
}

describe('owner status actions', () => {
  beforeEach(() => signInAs(1));

  it('unpublish_sendsNothingUntilConfirmed_andCancelSendsNothing', async () => {
    const listing = ownListing();
    mockOwnListing(listing);
    const bodies = recordStatusChanges(listing);
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Yayından kaldır' }));
    const dialog = screen.getByRole('alertdialog', { name: 'İlan yayından kaldırılsın mı?' });
    expect(dialog).toHaveTextContent('İstediğinizde tekrar yayına alabilirsiniz.');
    expect(bodies).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(bodies).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Yayından kaldır' }));
    await confirmDialog(user, 'Yayından kaldır');

    await waitFor(() => expect(bodies).toEqual([{ status: 'PASSIVE' }]));
    expect(await screen.findByText('İlan yayından kaldırıldı')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('confirmWhileSending_isDisabled_andDoubleClickSendsOneRequest', async () => {
    const listing = ownListing();
    mockOwnListing(listing);
    const bodies = recordStatusChanges(listing, 300);
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Satıldı olarak işaretle' }));
    const dialog = screen.getByRole('alertdialog', {
      name: 'İlan satıldı olarak işaretlensin mi?',
    });
    await user.dblClick(within(dialog).getByRole('button', { name: 'Satıldı olarak işaretle' }));

    expect(within(dialog).getByRole('button', { name: 'Gönderiliyor...' })).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(bodies).toEqual([{ status: 'SOLD' }]);
  });

  it('escape_closesDialog_andReturnsFocusToOpener', async () => {
    const listing = ownListing();
    mockOwnListing(listing);
    const bodies = recordStatusChanges(listing);
    renderApp('/ilan/7');
    const user = userEvent.setup();

    const opener = await screen.findByRole('button', { name: 'Yayından kaldır' });
    await user.click(opener);
    expect(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Vazgeç' }),
    ).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(bodies).toEqual([]);
  });
});

describe('listing forms', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
    mockImageBackend();
  });

  it('create_validForm_asksFirst_andPostsOnlyAfterConfirming', async () => {
    let postCount = 0;
    server.use(
      mockHttp.post(apiUrl('/listings'), () => {
        postCount += 1;
        return HttpResponse.json(ownListing({ status: 'PENDING_APPROVAL' }), { status: 201 });
      }),
      mockHttp.get(apiUrl('/listings/7'), () => HttpResponse.json(ownListing())),
    );
    renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });
    await fillListingFields(user);
    await pickPhotos(user, [createTestPhoto(4032, 3024)]);
    await waitForUploadsToSettle();

    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));
    const dialog = screen.getByRole('alertdialog', { name: 'İlan gönderilsin mi?' });
    expect(dialog).toHaveTextContent('İlanınız admin onayından sonra yayına girecek.');
    await user.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect(postCount).toBe(0);

    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));
    await confirmDialog(user, 'Gönder');

    await waitFor(() => expect(postCount).toBe(1));
  });

  it('edit_priceChange_warnsAboutReview_butKilometreChangeDoesNot', async () => {
    mockOwnListing(ownListing());
    renderApp('/ilan/7/duzenle');
    const user = userEvent.setup();
    await screen.findByRole('option', { name: '1.0 TCe' });
    const save = screen.getByRole('button', { name: 'Değişiklikleri kaydet' });

    await user.clear(screen.getByLabelText('Kilometre'));
    await user.type(screen.getByLabelText('Kilometre'), '90000');
    await user.click(save);
    const plainDialog = screen.getByRole('alertdialog', { name: 'Değişiklikler kaydedilsin mi?' });
    expect(plainDialog).toHaveTextContent('İlanınız güncellenecek.');
    expect(plainDialog).not.toHaveTextContent(REVIEW_TEXT);
    expect(within(plainDialog).getByRole('button', { name: 'Kaydet' })).toBeInTheDocument();
    await user.click(within(plainDialog).getByRole('button', { name: 'Vazgeç' }));

    await user.clear(screen.getByLabelText('Fiyat'));
    await user.type(screen.getByLabelText('Fiyat'), '640000');
    await user.click(save);
    const reviewDialog = screen.getByRole('alertdialog', { name: 'Değişiklikler kaydedilsin mi?' });
    expect(reviewDialog).toHaveTextContent(REVIEW_TEXT);
    expect(
      within(reviewDialog).getByRole('button', { name: 'Kaydet ve onaya gönder' }),
    ).toBeInTheDocument();
  });
});

describe('admin actions', () => {
  beforeEach(() => signInAs(1, adminUser));

  it('approve_sendsNothingUntilConfirmed', async () => {
    let approveCount = 0;
    server.use(
      mockHttp.get(apiUrl('/admin/listings/7'), () =>
        HttpResponse.json(buildListingDetail({ status: 'PENDING_APPROVAL' })),
      ),
      mockHttp.post(apiUrl('/admin/listings/7/approve'), () => {
        approveCount += 1;
        return HttpResponse.json(buildListingDetail({ status: 'ACTIVE' }));
      }),
    );
    renderApp('/admin/ilanlar/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Onayla' }));
    const dialog = screen.getByRole('alertdialog', { name: 'İlan onaylansın mı?' });
    expect(dialog).toHaveTextContent('İlan hemen yayına girecek.');
    expect(approveCount).toBe(0);

    await confirmDialog(user, 'Onayla');

    await waitFor(() => expect(approveCount).toBe(1));
  });
});
