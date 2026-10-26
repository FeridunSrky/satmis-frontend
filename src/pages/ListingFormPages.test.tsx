import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildErrorResponse } from '@/test/fixtures';
import { buildListingDetail, mockCatalog, ownListingOverrides } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

async function chooseOption(user: UserEvent, label: string, option: string) {
  // Catalog options arrive asynchronously, as they would for a real user
  await screen.findByRole('option', { name: option });
  await user.selectOptions(screen.getByRole('combobox', { name: label }), option);
}

async function fillValidListing(user: UserEvent) {
  await user.type(screen.getByLabelText('Başlık'), 'Hatasız 2019 Clio');
  await user.type(screen.getByLabelText('Fiyat'), '650000,50');
  await chooseOption(user, 'Marka', 'Renault');
  await chooseOption(user, 'Model', 'Clio');
  await chooseOption(user, 'Seri', '1.0 TCe');
  await user.type(screen.getByLabelText('Model yılı'), '2019');
  await user.type(screen.getByLabelText('Kilometre'), '85000');
  await user.selectOptions(screen.getByLabelText('Yakıt'), 'Benzin');
  await user.selectOptions(screen.getByLabelText('Vites'), 'Manuel');
  await chooseOption(user, 'İl', 'İstanbul');
  await chooseOption(user, 'İlçe', 'Kadıköy');
  await user.type(screen.getByLabelText('Görsel 1 (kapak)'), 'https://cdn.example.com/clio.jpg');
}

describe('CreateListingPage', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
  });

  it('emptySubmit_showsFieldErrorsWithoutRequest', async () => {
    let requestCount = 0;
    server.use(
      mockHttp.post(apiUrl('/listings'), () => {
        requestCount += 1;
        return HttpResponse.json(buildListingDetail(), { status: 201 });
      }),
    );
    renderApp('/ilan-ver');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'İlanı yayınla' }));

    expect(await screen.findByText('Başlık en az 5 karakter olmalıdır')).toBeInTheDocument();
    expect(screen.getByText('Marka seçin')).toBeInTheDocument();
    expect(screen.getByText('Model yılı zorunludur')).toBeInTheDocument();
    expect(screen.getByText('Görsel adresi boş olamaz')).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it('validSubmit_sendsBackendShapeAndOpensDetail', async () => {
    let sentBody: unknown;
    server.use(
      mockHttp.post(apiUrl('/listings'), async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(buildListingDetail({ ...ownListingOverrides, id: 12 }), {
          status: 201,
        });
      }),
    );
    const { router } = renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });

    await fillValidListing(user);
    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));

    await waitFor(() => expect(currentPath(router)).toBe('/ilan/12'));
    expect(sentBody).toEqual({
      title: 'Hatasız 2019 Clio',
      price: '650000.50',
      currency: 'TRY',
      districtId: 341,
      vehicle: {
        seriesId: 1311,
        modelYear: 2019,
        kilometer: 85000,
        fuelType: 'GASOLINE',
        gearType: 'MANUAL',
        vehicleCondition: 'USED',
        fromWho: 'OWNER',
        hasDamageRecord: false,
        exchangeable: false,
      },
      imageUrls: ['https://cdn.example.com/clio.jpg'],
    });
  });

  it('backendValidationError_isShownOnMatchingField', async () => {
    server.use(
      mockHttp.post(apiUrl('/listings'), () =>
        HttpResponse.json(
          {
            status: 400,
            message: 'Doğrulama hatası',
            errors: { 'vehicle.modelYear': 'Model yılı seri ile uyumsuz' },
          },
          { status: 400 },
        ),
      ),
    );
    const { router } = renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });

    await fillValidListing(user);
    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));

    expect(await screen.findByText('Model yılı seri ile uyumsuz')).toBeInTheDocument();
    expect(screen.getByLabelText('Model yılı')).toHaveAttribute('aria-invalid', 'true');
    expect(currentPath(router)).toBe('/ilan-ver');
  });

  it('businessRuleError_isShownAboveForm', async () => {
    server.use(
      mockHttp.post(apiUrl('/listings'), () =>
        HttpResponse.json(buildErrorResponse(422, 'Seçilen seri bu modele ait değil'), {
          status: 422,
        }),
      ),
    );
    renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });

    await fillValidListing(user);
    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));

    expect(await screen.findByText('Seçilen seri bu modele ait değil')).toBeInTheDocument();
  });
});

describe('EditListingPage', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
  });

  it('versionConflict_offersReloadThatLoadsLatestValues', async () => {
    let detailVersion = 1;
    let sentVersion: unknown;
    server.use(
      mockHttp.get(apiUrl('/listings/7'), () =>
        HttpResponse.json(
          buildListingDetail({
            ...ownListingOverrides,
            version: detailVersion,
            title: detailVersion === 1 ? 'Eski başlık burada' : 'Başka sekmede değişti',
          }),
        ),
      ),
      mockHttp.put(apiUrl('/listings/7'), async ({ request }) => {
        const body = (await request.json()) as { version?: unknown };
        sentVersion = body.version;
        detailVersion = 2;
        return HttpResponse.json(
          buildErrorResponse(409, 'İlan başka biri tarafından güncellendi'),
          {
            status: 409,
          },
        );
      }),
    );
    renderApp('/ilan/7/duzenle');
    const user = userEvent.setup();

    expect(await screen.findByLabelText('Başlık')).toHaveValue('Eski başlık burada');
    await screen.findByRole('option', { name: '1.0 TCe' });
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));

    expect(await screen.findByText(/İlan başka bir yerde güncellendi/)).toBeInTheDocument();
    expect(sentVersion).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Güncel hali yükle' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Başlık')).toHaveValue('Başka sekmede değişti'),
    );
    expect(screen.queryByText(/İlan başka bir yerde güncellendi/)).not.toBeInTheDocument();
  });

  it('someoneElsesListing_showsNoForm', async () => {
    server.use(mockHttp.get(apiUrl('/listings/7'), () => HttpResponse.json(buildListingDetail())));
    renderApp('/ilan/7/duzenle');

    expect(
      await screen.findByRole('heading', { name: 'İlan bulunamadı veya düzenleme yetkiniz yok' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Başlık')).not.toBeInTheDocument();
  });
});
