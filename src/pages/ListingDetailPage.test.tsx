import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay } from 'msw';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { STALE_TIME_MS } from '@/app/queryClient';
import type { ListingDetail } from '@/features/listings/types';
import { buildAuthResponse, buildErrorResponse, testUser } from '@/test/fixtures';
import { buildListingDetail, OTHER_SELLER, ownListingOverrides } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

function mockDetail(listing: ListingDetail) {
  server.use(mockHttp.get(apiUrl(`/listings/${listing.id}`), () => HttpResponse.json(listing)));
}

describe('ListingDetailPage', () => {
  it('nonOwner_seesListingButNoOwnerActions', async () => {
    signInAs(1);
    mockDetail(buildListingDetail());
    renderApp('/ilan/7');

    expect(
      await screen.findByRole('heading', { name: 'Hatasız 2019 Clio, bakımları yeni' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mehmet Kaya')).toBeInTheDocument();
    expect(screen.getByText('Önden çekiş')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Düzenle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sil' })).not.toBeInTheDocument();
  });

  it('ownerOfActiveListing_seesOnlyAllowedTransitions', async () => {
    signInAs(1);
    mockDetail(buildListingDetail(ownListingOverrides));
    renderApp('/ilan/7');

    expect(await screen.findByRole('button', { name: 'Yayından kaldır' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Satıldı olarak işaretle' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yayına al' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Düzenle' })).toHaveAttribute(
      'href',
      '/ilan/7/duzenle',
    );
  });

  it('ownerOfSoldListing_cannotEditOrChangeStatus', async () => {
    signInAs(1);
    mockDetail(buildListingDetail({ ...ownListingOverrides, status: 'SOLD' }));
    renderApp('/ilan/7');

    expect(await screen.findByRole('button', { name: 'Sil' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Düzenle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Yayın|Satıldı olarak/ })).not.toBeInTheDocument();
  });

  it('ownerChangesStatus_sendsPatchAndShowsNewBadge', async () => {
    signInAs(1);
    const listing = buildListingDetail(ownListingOverrides);
    let sentBody: unknown;
    mockDetail(listing);
    server.use(
      mockHttp.patch(apiUrl('/listings/7/status'), async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ ...listing, status: 'PASSIVE' });
      }),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Yayından kaldır' }));

    expect(await screen.findByRole('button', { name: 'Yayına al' })).toBeInTheDocument();
    expect(sentBody).toEqual({ status: 'PASSIVE' });
  });

  it('ownerDeletes_afterConfirming_goesToMyListings', async () => {
    signInAs(1);
    mockDetail(buildListingDetail(ownListingOverrides));
    server.use(
      mockHttp.delete(apiUrl('/listings/7'), () => new HttpResponse(null, { status: 204 })),
      mockHttp.get(apiUrl('/users/me/listings'), () =>
        HttpResponse.json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
      ),
    );
    const { router } = renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Sil' }));
    await user.click(screen.getByRole('button', { name: 'İlanı sil' }));

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlarim'));
    expect(await screen.findByText('İlan silindi')).toBeInTheDocument();
  });

  it('missingListing_showsNotFound', async () => {
    signOutCompletely();
    server.use(
      mockHttp.get(apiUrl('/listings/404'), () =>
        HttpResponse.json(buildErrorResponse(404, 'İlan bulunamadı'), { status: 404 }),
      ),
    );
    renderApp('/ilan/404');

    expect(await screen.findByRole('heading', { name: 'İlan bulunamadı' })).toBeInTheDocument();
  });

  it('nonNumericId_showsNotFoundWithoutRequest', async () => {
    signOutCompletely();
    renderApp('/ilan/abc');

    expect(await screen.findByRole('heading', { name: 'İlan bulunamadı' })).toBeInTheDocument();
  });
});

describe('FavoriteButton on the detail page', () => {
  it('anonymousClick_redirectsToLoginWithNext', async () => {
    signOutCompletely();
    mockDetail(buildListingDetail());
    const { router } = renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Favorilere ekle/ }));

    await waitFor(() => expect(currentPath(router)).toBe('/giris?next=%2Filan%2F7'));
  });

  it('signedInClick_togglesImmediately', async () => {
    signInAs(1);
    const listing = buildListingDetail();
    let isFavorited = false;
    server.use(
      mockHttp.get(apiUrl('/listings/7'), () =>
        HttpResponse.json(
          isFavorited ? { ...listing, favoritedByMe: true, favoriteCount: 4 } : listing,
        ),
      ),
      mockHttp.put(apiUrl('/listings/7/favorite'), async () => {
        await delay(50);
        isFavorited = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Favorilere ekle/ }));

    // Pressed before the server has answered
    const pressedButton = screen.getByRole('button', { name: /Favorilerimde/ });
    expect(pressedButton).toHaveAttribute('aria-pressed', 'true');
    expect(pressedButton).toHaveTextContent('4');
    // Let the request settle inside this test so nothing leaks into the next one
    await waitFor(() => expect(isFavorited).toBe(true));
  });

  it('addThenRemove_updatesCountWithoutRefetchingDetail', async () => {
    signInAs(1);
    let detailRequests = 0;
    let favoriteRequests = 0;
    server.use(
      mockHttp.get(apiUrl('/listings/7'), () => {
        detailRequests += 1;
        return HttpResponse.json(buildListingDetail());
      }),
      mockHttp.put(apiUrl('/listings/7/favorite'), () => {
        favoriteRequests += 1;
        return new HttpResponse(null, { status: 204 });
      }),
      mockHttp.delete(apiUrl('/listings/7/favorite'), () => {
        favoriteRequests += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Favorilere ekle/ }));
    await waitFor(() => expect(favoriteRequests).toBe(1));
    expect(screen.getByRole('button', { name: /Favorilerimde/ })).toHaveTextContent('4');

    await user.click(screen.getByRole('button', { name: /Favorilerimde/ }));
    await waitFor(() => expect(favoriteRequests).toBe(2));
    expect(screen.getByRole('button', { name: /Favorilere ekle/ })).toHaveTextContent('3');

    // The backend counts a view on every detail GET; favoriting must not add any
    expect(detailRequests).toBe(1);
  });

  it('signedInClick_requestFails_rollsBack', async () => {
    signInAs(1);
    mockDetail(buildListingDetail());
    server.use(
      mockHttp.put(apiUrl('/listings/7/favorite'), () =>
        HttpResponse.json(buildErrorResponse(404, 'İlan bulunamadı'), { status: 404 }),
      ),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Favorilere ekle/ }));

    const restoredButton = await screen.findByRole('button', { name: /Favorilere ekle/ });
    expect(restoredButton).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByText('Favori güncellenemedi: İlan bulunamadı')).toBeInTheDocument();
  });
});

describe('Seller phone on the detail page', () => {
  it('signedIn_seesCallableFormattedNumber', async () => {
    signInAs(1);
    mockDetail(buildListingDetail());
    renderApp('/ilan/7');

    const phoneLink = await screen.findByRole('link', { name: '0555 987 65 43' });
    expect(phoneLink).toHaveAttribute('href', 'tel:05559876543');
  });

  it('anonymous_seesSignInLinkInsteadOfNumber', async () => {
    signOutCompletely();
    mockDetail(buildListingDetail({ seller: { ...OTHER_SELLER, phone: null } }));
    renderApp('/ilan/7');

    const signInLink = await screen.findByRole('link', {
      name: 'Numarayı görmek için giriş yapın',
    });
    expect(signInLink).toHaveAttribute('href', '/giris?next=%2Filan%2F7');
    expect(screen.queryByRole('link', { name: /0555/ })).not.toBeInTheDocument();
  });

  it('signingInFromListing_returnsAndShowsNumber', async () => {
    signOutCompletely();
    server.use(
      // Like the backend: the number is only sent with a valid access token
      mockHttp.get(apiUrl('/listings/7'), ({ request }) => {
        const isSignedIn = request.headers.has('Authorization');
        return HttpResponse.json(
          buildListingDetail({
            seller: { ...OTHER_SELLER, phone: isSignedIn ? OTHER_SELLER.phone : null },
          }),
        );
      }),
      mockHttp.post(apiUrl('/auth/login'), () => HttpResponse.json(buildAuthResponse(1))),
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
    );
    const { router, queryClient } = renderApp('/ilan/7');
    // Use the app's real cache lifetime so the anonymous copy would still count as fresh
    queryClient.setDefaultOptions({ queries: { retry: false, staleTime: STALE_TIME_MS } });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('link', { name: 'Numarayı görmek için giriş yapın' }));
    await user.type(await screen.findByLabelText('E-posta'), testUser.email);
    await user.type(screen.getByLabelText('Şifre'), 'GizliSifre123');
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));

    await waitFor(() => expect(currentPath(router)).toBe('/ilan/7'));
    expect(await screen.findByRole('link', { name: '0555 987 65 43' })).toBeInTheDocument();
  });
});
