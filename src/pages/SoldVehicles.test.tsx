import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SoldVehicleDetail, SoldVehicleSummary } from '@/features/soldVehicles/types';
import { formatPrice } from '@/shared/lib/format';
import { confirmDialog } from '@/test/dialogHelpers';
import { adminUser, buildErrorResponse } from '@/test/fixtures';
import { buildListingDetail, buildPage, mockCatalog, OTHER_SELLER } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const listing = buildListingDetail({ seller: OTHER_SELLER });

const soldSummary: SoldVehicleSummary = {
  id: 7,
  title: 'Temiz Clio',
  listingPrice: 750000,
  salePrice: 720000,
  currency: 'TRY',
  soldAt: '2026-11-01T10:00:00Z',
  cityName: 'İstanbul',
  districtName: 'Kadıköy',
  brandName: 'Renault',
  modelName: 'Clio',
  seriesName: '1.0 TCe',
  modelYear: 2020,
  kilometer: 45000,
  fuelType: 'GASOLINE',
  gearType: 'MANUAL',
  coverImageUrl: null,
};

const soldDetail: SoldVehicleDetail = {
  id: 7,
  title: 'Temiz Clio',
  description: 'Bakımlı',
  listingPrice: 750000,
  salePrice: 720000,
  currency: 'TRY',
  saleNote: 'Pazarlıkla anlaştık',
  soldAt: '2026-11-01T10:00:00Z',
  createdAt: '2026-10-01T10:00:00Z',
  location: listing.location,
  vehicle: listing.vehicle,
  images: [],
};

/** Records the query strings both list endpoints receive. */
function mockSoldList(content: SoldVehicleSummary[]) {
  const requests = { search: [] as URLSearchParams[], summary: [] as URLSearchParams[] };
  const currencies =
    content.length === 0
      ? []
      : [{ currency: 'TRY', count: 3, average: 700000.5, min: 650000, max: 760000 }];
  server.use(
    mockHttp.get(apiUrl('/sold-vehicles'), ({ request }) => {
      requests.search.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(content));
    }),
    mockHttp.get(apiUrl('/sold-vehicles/summary'), ({ request }) => {
      requests.summary.push(new URL(request.url).searchParams);
      return HttpResponse.json({ currencies });
    }),
  );
  return requests;
}

describe('sold vehicles list', () => {
  beforeEach(() => {
    signOutCompletely();
    mockCatalog();
  });

  it('readsFiltersFromUrl_sendsThem_showsSummaryAndCards_withoutSeller', async () => {
    const requests = mockSoldList([soldSummary]);
    renderApp('/satilmis-araclar?marka=13&min-fiyat=600000&sirala=PRICE_ASC');

    const card = await screen.findByRole('article');
    expect(card).toHaveTextContent(formatPrice(720000, 'TRY'));
    expect(card).toHaveTextContent(`İlan fiyatı: ${formatPrice(750000, 'TRY')}`);
    expect(card).toHaveTextContent('Satıldı');
    expect(screen.getByRole('link', { name: 'Temiz Clio' })).toHaveAttribute(
      'href',
      '/satilmis-araclar/7',
    );

    const summary = await screen.findByRole('region', { name: 'Fiyat özeti' });
    expect(summary).toHaveTextContent('Bu aramada 3 araç satıldı');
    expect(summary).toHaveTextContent(`Ortalama ${formatPrice(700000.5, 'TRY')}`);
    expect(summary).toHaveTextContent(`En düşük ${formatPrice(650000, 'TRY')}`);
    expect(summary).toHaveTextContent(`En yüksek ${formatPrice(760000, 'TRY')}`);
    expect(screen.getByRole('group', { name: 'Satış fiyatı' })).toBeInTheDocument();

    const search = requests.search.at(-1);
    expect(search?.get('brandId')).toBe('13');
    expect(search?.get('minPrice')).toBe('600000');
    expect(search?.get('sort')).toBe('PRICE_ASC');
    const summaryQuery = requests.summary.at(-1);
    expect(summaryQuery?.get('brandId')).toBe('13');
    expect(summaryQuery?.has('sort')).toBe(false);

    expect(screen.queryByText(new RegExp(OTHER_SELLER.lastName))).not.toBeInTheDocument();
    expect(screen.queryByText(/0555/)).not.toBeInTheDocument();
  });

  it('noSales_showsTheEmptyMessage_andNoSummary', async () => {
    mockSoldList([]);
    renderApp('/satilmis-araclar');

    expect(await screen.findByText('Bu filtrelerle satılmış araç bulunamadı.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Fiyat özeti' })).not.toBeInTheDocument();
  });
});

describe('sold vehicle detail', () => {
  it('notVisible_showsNotFound_withLinkBackToTheList', async () => {
    signOutCompletely();
    server.use(
      mockHttp.get(apiUrl('/sold-vehicles/7'), () =>
        HttpResponse.json(buildErrorResponse(404, 'Bulunamadı'), { status: 404 }),
      ),
    );
    renderApp('/satilmis-araclar/7');

    expect(await screen.findByText('Satılmış araç bulunamadı')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Satılmış araçlara dön' })).toHaveAttribute(
      'href',
      '/satilmis-araclar',
    );
  });

  it('regularUser_seesTheSaleButNoHideButton', async () => {
    signInAs(1);
    server.use(mockHttp.get(apiUrl('/sold-vehicles/7'), () => HttpResponse.json(soldDetail)));
    renderApp('/satilmis-araclar/7');

    expect(await screen.findByRole('heading', { name: 'Temiz Clio' })).toBeInTheDocument();
    expect(screen.getByText('Pazarlıkla anlaştık')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Satışı gizle' })).not.toBeInTheDocument();
  });

  it('admin_hidesTheSaleAfterConfirming_andReturnsToTheList', async () => {
    signInAs(1, adminUser);
    mockCatalog();
    mockSoldList([]);
    let hideCount = 0;
    server.use(
      mockHttp.get(apiUrl('/sold-vehicles/7'), () => HttpResponse.json(soldDetail)),
      mockHttp.post(apiUrl('/admin/sold-vehicles/7/hide'), () => {
        hideCount += 1;
        return HttpResponse.json(
          buildListingDetail({
            status: 'SOLD',
            sale: { salePrice: 720000, note: null, soldAt: soldDetail.soldAt, hidden: true },
          }),
        );
      }),
    );
    const { router } = renderApp('/satilmis-araclar/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Satışı gizle' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('İlan satılmış olarak kalır.');
    expect(hideCount).toBe(0);
    await confirmDialog(user, 'Satışı gizle');

    await waitFor(() => expect(hideCount).toBe(1));
    await waitFor(() => expect(currentPath(router)).toBe('/satilmis-araclar'));
    expect(
      await screen.findByText('Satış satılmış araçlar sayfasından kaldırıldı'),
    ).toBeInTheDocument();
  });
});
