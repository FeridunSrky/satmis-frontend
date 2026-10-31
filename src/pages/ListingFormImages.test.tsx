import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildErrorResponse } from '@/test/fixtures';
import {
  createBrokenPhoto,
  createTestPhoto,
  installImageFakes,
  mockImageBackend,
  UPLOAD_HEADERS,
  type ImageBackendLog,
} from '@/test/imageMocks';
import { buildListingDetail, mockCatalog, ownListingOverrides } from '@/test/listingFixtures';
import { fillListingFields, pickPhotos, waitForUploadsToSettle } from '@/test/listingFormHelpers';
import { renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const PUBLISH = 'İlanı yayınla';
const SAVE_EDIT = 'Değişiklikleri kaydet';

// Sizes differ so each photo's re-encoded blob, and therefore its reservation, is recognisable
const photoA = () => createTestPhoto(1000, 750, 'a.jpg');
const photoB = () => createTestPhoto(1200, 900, 'b.jpg');
const photoC = () => createTestPhoto(1600, 1200, 'c.jpg');
const encodedSize = (width: number, height: number) => Math.ceil((width * height) / 100);

function idOfPhoto(log: ImageBackendLog, width: number, height: number): number | undefined {
  return log.reservations.find((upload) => upload.sizeBytes === encodedSize(width, height))?.id;
}

function mockCreateListing() {
  const sentBodies: Array<{ imageIds?: unknown; title?: unknown }> = [];
  server.use(
    mockHttp.post(apiUrl('/listings'), async ({ request }) => {
      sentBodies.push((await request.json()) as (typeof sentBodies)[number]);
      return HttpResponse.json(buildListingDetail({ ...ownListingOverrides, id: 12 }), {
        status: 201,
      });
    }),
  );
  return sentBodies;
}

async function openCreateForm() {
  renderApp('/ilan-ver');
  const user = userEvent.setup();
  await screen.findByRole('heading', { name: 'İlan ver' });
  return user;
}

afterEach(() => vi.unstubAllGlobals());

describe('ListingForm images: uploading', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
  });

  it('pickPhoto_reservesWithShrunkBlob_putsWithoutAuthorization_thenCompletes', async () => {
    const canvas = installImageFakes();
    const { log } = mockImageBackend();
    const user = await openCreateForm();
    const photo = createTestPhoto(4032, 3024);

    await pickPhotos(user, [photo]);

    expect(await screen.findByRole('img', { name: 'Görsel 1 (kapak)' })).toBeInTheDocument();
    await waitForUploadsToSettle();
    expect(canvas.sizes).toEqual([{ width: 2048, height: 1536 }]);
    expect(log.reservations).toEqual([
      { id: 101, contentType: 'image/webp', sizeBytes: encodedSize(2048, 1536) },
    ]);
    expect(encodedSize(2048, 1536)).toBeLessThan(photo.size);
    const [put] = log.puts;
    expect(put?.size).toBe(encodedSize(2048, 1536));
    expect(put?.headers.get('authorization')).toBeNull();
    expect(put?.headers.get('content-type')).toBe(UPLOAD_HEADERS['content-type']);
    expect(put?.headers.get('cache-control')).toBe(UPLOAD_HEADERS['cache-control']);
    expect(log.completes).toEqual([101]);
  });

  it('pickManyPhotos_uploadsAtMostThreeAtATime', async () => {
    installImageFakes();
    const { log, releasePuts } = mockImageBackend({ holdPuts: true });
    const user = await openCreateForm();
    const photos = [400, 500, 600, 700, 800].map((width) => createTestPhoto(width, 300));

    await pickPhotos(user, photos);

    await waitFor(() => expect(log.puts).toHaveLength(3));
    releasePuts();
    await waitFor(() => expect(log.completes).toHaveLength(5));
    expect(log.maxParallelPuts).toBe(3);
  });

  it('pickMoreThanTwentyPhotos_keepsTwentyAndSaysSo', async () => {
    installImageFakes();
    mockImageBackend();
    const user = await openCreateForm();
    const photos = Array.from({ length: 21 }, (_, index) => createTestPhoto(100 + index, 100));

    await pickPhotos(user, photos);

    expect(await screen.findByText(/En fazla 20 görsel ekleyebilirsiniz/)).toBeInTheDocument();
    expect(screen.getByText('20/20 görsel')).toBeInTheDocument();
    expect(screen.getByLabelText('Görsel seç')).toBeDisabled();
  });

  it('whileUploading_saveIsDisabledWithReason', async () => {
    installImageFakes();
    const { releasePuts } = mockImageBackend({ holdPuts: true });
    const user = await openCreateForm();

    await pickPhotos(user, [photoA()]);

    const publish = screen.getByRole('button', { name: PUBLISH });
    await waitFor(() => expect(publish).toBeDisabled());
    expect(publish).toHaveAccessibleDescription(/Görseller yükleniyor/);
    releasePuts();
    await waitFor(() => expect(publish).toBeEnabled());
  });
});

describe('ListingForm images: order and removal', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
  });

  it('save_sendsImageIdsInScreenOrder_afterMovingAndChangingCover', async () => {
    const { log } = mockImageBackend();
    const sentBodies = mockCreateListing();
    const user = await openCreateForm();
    await fillListingFields(user);
    await pickPhotos(user, [photoA(), photoB(), photoC()]);
    await waitForUploadsToSettle();
    const [idA, idB, idC] = [
      idOfPhoto(log, 1000, 750),
      idOfPhoto(log, 1200, 900),
      idOfPhoto(log, 1600, 1200),
    ];

    await user.click(screen.getByRole('button', { name: '3. görseli kapak yap' }));
    await user.click(screen.getByRole('button', { name: '2. görseli sağa taşı' }));
    await user.click(screen.getByRole('button', { name: PUBLISH }));

    await waitFor(() => expect(sentBodies).toHaveLength(1));
    expect(sentBodies[0]?.imageIds).toEqual([idC, idB, idA]);
  });

  it('removeUploadedPhoto_deletesItAndFreesItsPreview', async () => {
    const canvas = installImageFakes();
    const { log } = mockImageBackend();
    const user = await openCreateForm();
    await pickPhotos(user, [photoA()]);
    await waitForUploadsToSettle();

    await user.click(screen.getByRole('button', { name: '1. görseli kaldır' }));

    expect(screen.queryByRole('img', { name: /Görsel 1/ })).not.toBeInTheDocument();
    await waitFor(() => expect(log.deletes).toEqual([101]));
    expect(canvas.revokedUrls).toHaveLength(1);
  });

  it('editRemoveExistingAndAddNew_doesNotDeleteExisting_andPutsRemainingIdsInOrder', async () => {
    const { log } = mockImageBackend();
    let sentImageIds: unknown;
    server.use(
      mockHttp.get(apiUrl('/listings/7'), () =>
        HttpResponse.json(buildListingDetail(ownListingOverrides)),
      ),
      mockHttp.put(apiUrl('/listings/7'), async ({ request }) => {
        sentImageIds = ((await request.json()) as { imageIds?: unknown }).imageIds;
        return HttpResponse.json(buildListingDetail(ownListingOverrides));
      }),
    );
    renderApp('/ilan/7/duzenle');
    const user = userEvent.setup();
    expect(await screen.findByRole('img', { name: 'Görsel 1 (kapak)' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/clio-1.jpg',
    );
    await screen.findByRole('option', { name: '1.0 TCe' });

    await user.click(screen.getByRole('button', { name: '1. görseli kaldır' }));
    await pickPhotos(user, [photoA()]);
    await waitForUploadsToSettle();
    await user.click(screen.getByRole('button', { name: SAVE_EDIT }));

    await waitFor(() => expect(sentImageIds).toEqual([2, 101]));
    expect(log.deletes).toEqual([]);
  });
});

describe('ListingForm images: failures', () => {
  beforeEach(() => {
    signInAs(1);
    mockCatalog();
    installImageFakes();
  });

  it('completeSaysInvalid_showsMessageWithoutRetry_blocksSaveUntilRemoved', async () => {
    mockImageBackend({ completeAnswers: ['invalid'] });
    const user = await openCreateForm();

    await pickPhotos(user, [photoA()]);

    expect(await screen.findByText('Dosya geçerli bir görsel değil')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '1. görseli tekrar yükle' }),
    ).not.toBeInTheDocument();
    const publish = screen.getByRole('button', { name: PUBLISH });
    expect(publish).toBeDisabled();
    expect(publish).toHaveAccessibleDescription(/Yüklenemeyen görselleri kaldırın/);

    await user.click(screen.getByRole('button', { name: '1. görseli kaldır' }));

    expect(publish).toBeEnabled();
  });

  it('undecodableFile_isRejectedBeforeAnyRequest', async () => {
    const { log } = mockImageBackend();
    const user = await openCreateForm();

    await pickPhotos(user, [createBrokenPhoto()]);

    expect(
      await screen.findByText('Bu görsel açılamadı, JPEG veya PNG olarak deneyin'),
    ).toBeInTheDocument();
    expect(log.reservations).toEqual([]);
  });

  it('storageForbidden_retryAsksForNewUploadUrlAndDiscardsTheOldOne', async () => {
    const { log } = mockImageBackend({ storageAnswers: ['forbidden'] });
    const user = await openCreateForm();
    await pickPhotos(user, [photoA()]);
    expect(await screen.findByText('Yükleme başarısız')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1. görseli tekrar yükle' }));

    await waitForUploadsToSettle();
    await waitFor(() => expect(log.completes).toEqual([102]));
    expect(log.reservations.map((upload) => upload.id)).toEqual([101, 102]);
    expect(log.puts.map((put) => new URL(put.url).pathname)).toEqual([
      '/listings/101.webp',
      '/listings/102.webp',
    ]);
    expect(log.deletes).toEqual([101]);
    expect(screen.queryByText('Yükleme başarısız')).not.toBeInTheDocument();
  });

  it('completeSaysNotUploaded_repeatsThePutOnceAndSucceeds', async () => {
    const { log } = mockImageBackend({ completeAnswers: ['notUploaded'] });
    const user = await openCreateForm();

    await pickPhotos(user, [photoA()]);

    await waitFor(() => expect(log.completes).toEqual([101, 101]));
    expect(log.puts).toHaveLength(2);
    expect(log.reservations).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('saveSaysImageNotAvailable_showsMessageAndKeepsFormValues', async () => {
    mockImageBackend();
    server.use(
      mockHttp.post(apiUrl('/listings'), () =>
        HttpResponse.json(
          {
            ...buildErrorResponse(422, 'Görsellerden biri artık kullanılamıyor'),
            code: 'IMAGE_NOT_AVAILABLE',
          },
          { status: 422 },
        ),
      ),
    );
    const user = await openCreateForm();
    await fillListingFields(user);
    await pickPhotos(user, [photoA()]);
    await waitForUploadsToSettle();

    await user.click(screen.getByRole('button', { name: PUBLISH }));

    const section = screen.getByRole('group', { name: 'Görseller' });
    expect(
      await within(section).findByText(
        'Görsellerden biri artık kullanılamıyor Görselleri yeniden yükleyin.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Başlık')).toHaveValue('Hatasız 2019 Clio');
    expect(screen.getByRole('img', { name: 'Görsel 1 (kapak)' })).toBeInTheDocument();
  });
});
