import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingDetail, ListingSale } from '@/features/listings/types';
import { formatPrice } from '@/shared/lib/format';
import { confirmDialog } from '@/test/dialogHelpers';
import { buildErrorResponse } from '@/test/fixtures';
import { buildListingDetail, ownListingOverrides } from '@/test/listingFixtures';
import { renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const OUT_OF_RANGE_MESSAGE = 'Satış fiyatı 600.000 ile 825.000 arasında olmalıdır';

function ownListing(overrides: Partial<ListingDetail> = {}): ListingDetail {
  return buildListingDetail({ ...ownListingOverrides, price: 750000, version: 3, ...overrides });
}

const sale: ListingSale = {
  salePrice: 720000,
  note: 'Pazarlıkla anlaştık',
  soldAt: '2026-11-01T10:00:00Z',
  hidden: false,
};

/** Detail from a mutable value (counting fetches) and the sale endpoint answering `answer`. */
function mockSaleBackend(answer: () => Response) {
  const state = { listing: ownListing(), detailRequests: 0, saleBodies: [] as unknown[] };
  server.use(
    mockHttp.get(apiUrl('/listings/7'), () => {
      state.detailRequests += 1;
      return HttpResponse.json(state.listing);
    }),
    mockHttp.post(apiUrl('/listings/7/sale'), async ({ request }) => {
      state.saleBodies.push(await request.json());
      return answer();
    }),
  );
  return state;
}

async function openSalePanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Satıldı olarak işaretle' }));
  return screen.getByRole('dialog', { name: 'Satıldı olarak işaretle' });
}

async function typeSalePrice(user: ReturnType<typeof userEvent.setup>, price: string) {
  const field = screen.getByLabelText(/^Satış fiyatı/);
  await user.clear(field);
  await user.type(field, price);
}

beforeEach(() => signInAs(1));

describe('sale panel', () => {
  it('outOfRangeThenValid_validatesLocally_andPostsTrimmedNoteWithVersionAfterConfirming', async () => {
    const state = mockSaleBackend(() =>
      HttpResponse.json(ownListing({ status: 'SOLD', sale, version: 4 })),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    const panel = await openSalePanel(user);
    expect(state.saleBodies).toEqual([]);
    expect(within(panel).getByLabelText(/^Satış fiyatı/)).toHaveValue('750000');
    expect(within(panel).getByText(/%80'i ile %110'u arasında olmalı/)).toHaveTextContent(
      `${formatPrice(600000, 'TRY')} – ${formatPrice(825000, 'TRY')}`,
    );

    await typeSalePrice(user, '500000');
    await user.click(within(panel).getByRole('button', { name: 'Satışı kaydet' }));
    expect(await within(panel).findByText(/Satış fiyatı .* arasında olmalı$/)).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await typeSalePrice(user, '720000');
    await user.type(screen.getByLabelText(/Satış açıklaması/), '  Pazarlıkla anlaştık  ');
    await user.click(screen.getByRole('button', { name: 'Satışı kaydet' }));
    const confirmation = screen.getByRole('alertdialog', {
      name: 'İlan satıldı olarak işaretlensin mi?',
    });
    expect(confirmation).toHaveTextContent(`Satış fiyatı: ${formatPrice(720000, 'TRY')}`);
    expect(state.saleBodies).toEqual([]);
    await confirmDialog(user, 'Satışı kaydet');

    await waitFor(() =>
      expect(state.saleBodies).toEqual([
        { salePrice: 720000, note: 'Pazarlıkla anlaştık', version: 3 },
      ]),
    );
    expect(await screen.findByText('İlan satıldı olarak işaretlendi')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancelInConfirmation_returnsToThePanelWithTheTypedValues_andSendsNothing', async () => {
    const state = mockSaleBackend(() => HttpResponse.json(ownListing()));
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await openSalePanel(user);
    await typeSalePrice(user, '700000');
    await user.click(screen.getByRole('button', { name: 'Satışı kaydet' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Vazgeç' }),
    );

    expect(screen.getByLabelText(/^Satış fiyatı/)).toHaveValue('700000');
    expect(state.saleBodies).toEqual([]);
  });

  it('backendSaysPriceOutOfRange_showsItsMessageUnderThePriceField', async () => {
    mockSaleBackend(() =>
      HttpResponse.json(
        { ...buildErrorResponse(422, OUT_OF_RANGE_MESSAGE), code: 'SALE_PRICE_OUT_OF_RANGE' },
        { status: 422 },
      ),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await openSalePanel(user);
    await user.click(screen.getByRole('button', { name: 'Satışı kaydet' }));
    await confirmDialog(user, 'Satışı kaydet');

    const field = await screen.findByLabelText(/^Satış fiyatı/);
    await waitFor(() =>
      expect(field).toHaveAccessibleDescription(new RegExp(OUT_OF_RANGE_MESSAGE)),
    );
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('staleVersion_saysSoAndReloadsTheListing', async () => {
    const state = mockSaleBackend(() =>
      HttpResponse.json(buildErrorResponse(409, 'Sürüm eski'), { status: 409 }),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    await openSalePanel(user);
    await user.click(screen.getByRole('button', { name: 'Satışı kaydet' }));
    const requestsBeforeSale = state.detailRequests;
    await confirmDialog(user, 'Satışı kaydet');

    expect(await screen.findByText(/İlan başka bir işlemle güncellendi/)).toBeInTheDocument();
    await waitFor(() => expect(state.detailRequests).toBeGreaterThan(requestsBeforeSale));
  });
});

describe('sold listing for its owner', () => {
  it('relist_afterConfirming_deletesTheSale_andShowsTheHiddenWarningBefore', async () => {
    let deleteCount = 0;
    server.use(
      mockHttp.get(apiUrl('/listings/7'), () =>
        HttpResponse.json(ownListing({ status: 'SOLD', sale: { ...sale, hidden: true } })),
      ),
      mockHttp.delete(apiUrl('/listings/7/sale'), () => {
        deleteCount += 1;
        return HttpResponse.json(ownListing({ status: 'ACTIVE' }));
      }),
    );
    renderApp('/ilan/7');
    const user = userEvent.setup();

    const card = await screen.findByRole('region', { name: 'Satış bilgisi' });
    expect(card).toHaveTextContent(
      'Bu satış yönetici tarafından satılmış araçlar sayfasından kaldırıldı.',
    );
    expect(card).toHaveTextContent(formatPrice(720000, 'TRY'));
    expect(card).toHaveTextContent('Pazarlıkla anlaştık');
    expect(screen.queryByRole('link', { name: 'Düzenle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sil' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tekrar yayına al' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Satış kaydı silinecek');
    expect(deleteCount).toBe(0);
    await confirmDialog(user, 'Tekrar yayına al');

    await waitFor(() => expect(deleteCount).toBe(1));
    expect(await screen.findByText('İlan tekrar yayında')).toBeInTheDocument();
  });
});
