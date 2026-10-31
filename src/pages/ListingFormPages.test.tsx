import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildErrorResponse, testUser } from '@/test/fixtures';
import { createTestPhoto, installImageFakes, mockImageBackend } from '@/test/imageMocks';
import { buildListingDetail, mockCatalog, ownListingOverrides } from '@/test/listingFixtures';
import { fillListingFields, pickPhotos, waitForUploadsToSettle } from '@/test/listingFormHelpers';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

async function fillValidListing(user: UserEvent) {
  await fillListingFields(user);
  await pickPhotos(user, [createTestPhoto(4032, 3024)]);
  await screen.findByRole('img', { name: 'Görsel 1 (kapak)' });
  await waitForUploadsToSettle();
}

afterEach(() => vi.unstubAllGlobals());

describe('CreateListingPage', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
    mockImageBackend();
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
    expect(screen.getByText('En az 1 görsel ekleyin')).toBeInTheDocument();
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
      imageIds: [101],
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

describe('CreateListingPage without a phone', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
    mockImageBackend();
  });

  it('phoneRequired_sendsUserToProfileWithMessage', async () => {
    server.use(
      mockHttp.post(apiUrl('/listings'), () =>
        HttpResponse.json(
          {
            ...buildErrorResponse(422, 'İlan vermek için profilinize telefon numarası ekleyin'),
            code: 'PHONE_REQUIRED',
          },
          { status: 422 },
        ),
      ),
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json({ ...testUser, phone: null })),
    );
    const { router } = renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });

    await fillValidListing(user);
    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));

    await waitFor(() => expect(currentPath(router)).toBe('/profil'));
    expect(
      await screen.findByText('İlan vermek için profilinize telefon numarası ekleyin'),
    ).toBeInTheDocument();
  });
});

describe('CreateListingPage with an unverified e-mail', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
    mockImageBackend();
  });

  it('emailNotVerified_showsVerificationPromptAboveFormAndStays', async () => {
    let resendCalls = 0;
    server.use(
      mockHttp.post(apiUrl('/listings'), () =>
        HttpResponse.json(
          {
            ...buildErrorResponse(422, 'İlan vermek için e-posta adresinizi doğrulayın'),
            code: 'EMAIL_NOT_VERIFIED',
          },
          { status: 422 },
        ),
      ),
      mockHttp.post(apiUrl('/users/me/email-verification'), () => {
        resendCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderApp('/ilan-ver');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'İlan ver' });

    await fillValidListing(user);
    await user.click(screen.getByRole('button', { name: 'İlanı yayınla' }));

    expect(
      await screen.findByText(/İlan vermek için e-posta adresini doğrula/),
    ).toBeInTheDocument();
    expect(currentPath(router)).toBe('/ilan-ver');
    expect(screen.getByLabelText('Başlık')).toHaveValue('Hatasız 2019 Clio');

    await user.click(screen.getByRole('button', { name: 'Tekrar gönder' }));

    expect(await screen.findByText('Yeni doğrulama linki gönderildi')).toBeInTheDocument();
    expect(resendCalls).toBe(1);
  });
});

describe('EditListingPage', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
    mockImageBackend();
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
