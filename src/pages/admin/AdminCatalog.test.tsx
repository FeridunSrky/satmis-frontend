import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CatalogItem } from '@/shared/api/types';
import { adminUser, buildErrorResponse } from '@/test/fixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

/** A small catalog whose brand list grows when a brand is added. */
function mockCatalogBackend() {
  const state = {
    brands: [
      { id: 2, name: 'BMW' },
      { id: 13, name: 'Renault' },
    ] as CatalogItem[],
    modelRequests: [] as string[],
    createdBrandNames: [] as unknown[],
  };
  server.use(
    mockHttp.get(apiUrl('/catalog/brands'), () => HttpResponse.json(state.brands)),
    mockHttp.get(apiUrl('/catalog/brands/:brandId/models'), ({ params }) => {
      state.modelRequests.push(String(params.brandId));
      return HttpResponse.json(params.brandId === '13' ? [{ id: 131, name: 'Clio' }] : []);
    }),
    mockHttp.get(apiUrl('/catalog/models/:modelId/series'), () =>
      HttpResponse.json([{ id: 1311, name: '1.0 TCe' }]),
    ),
    mockHttp.post(apiUrl('/admin/catalog/brands'), async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      state.createdBrandNames.push(name);
      if (state.brands.some((brand) => brand.name.toLowerCase() === name.toLowerCase())) {
        return HttpResponse.json(buildErrorResponse(409, 'Bu isimde bir marka zaten var'), {
          status: 409,
        });
      }
      const brand = { id: 50, name };
      state.brands = [...state.brands, brand];
      return HttpResponse.json(brand, { status: 201 });
    }),
  );
  return state;
}

/** The catalog page is lazy, so wait for it before querying synchronously. */
async function renderCatalog() {
  const rendered = renderApp('/admin/katalog');
  await screen.findByRole('heading', { name: 'Katalog' });
  return rendered;
}

function column(name: string) {
  return within(screen.getByRole('region', { name }));
}

beforeEach(() => signInAs(1, adminUser));

describe('admin catalog', () => {
  it('addBrand_refreshesListAndSelectsIt', async () => {
    const state = mockCatalogBackend();
    const { router } = await renderCatalog();
    const user = userEvent.setup();
    expect(
      screen.getByText('Katalog kayıtları eklendikten sonra değiştirilemez veya silinemez.'),
    ).toBeInTheDocument();
    await column('Markalar').findByRole('button', { name: 'Renault' });

    await user.type(column('Markalar').getByLabelText('Yeni marka'), '  Togg  ');
    await user.click(column('Markalar').getByRole('button', { name: 'Ekle' }));

    // The list refreshes first; selecting the new brand follows as a URL change
    const newBrand = await column('Markalar').findByRole('button', { name: 'Togg' });
    await waitFor(() => expect(newBrand).toHaveAttribute('aria-pressed', 'true'));
    expect(state.createdBrandNames).toEqual(['Togg']);
    expect(column('Markalar').getByLabelText('Yeni marka')).toHaveValue('');
    await waitFor(() => expect(currentPath(router)).toBe('/admin/katalog?marka=50'));
  });

  it('duplicateBrand_showsBackendMessageUnderInput', async () => {
    mockCatalogBackend();
    await renderCatalog();
    const user = userEvent.setup();
    await column('Markalar').findByRole('button', { name: 'BMW' });

    await user.type(column('Markalar').getByLabelText('Yeni marka'), 'bmw');
    await user.click(column('Markalar').getByRole('button', { name: 'Ekle' }));

    const input = column('Markalar').getByLabelText('Yeni marka');
    await waitFor(() => expect(input).toHaveAccessibleDescription('Bu isimde bir marka zaten var'));
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('emptyName_isRejectedWithoutRequest', async () => {
    const state = mockCatalogBackend();
    await renderCatalog();
    const user = userEvent.setup();
    await column('Markalar').findByRole('button', { name: 'BMW' });

    await user.click(column('Markalar').getByRole('button', { name: 'Ekle' }));

    expect(await column('Markalar').findByText('İsim zorunludur')).toBeInTheDocument();
    expect(state.createdBrandNames).toEqual([]);
  });

  it('models_areRequestedForTheSelectedBrand', async () => {
    const state = mockCatalogBackend();
    await renderCatalog();
    const user = userEvent.setup();
    expect(
      column('Modeller').getByText('Modelleri görmek için bir marka seçin.'),
    ).toBeInTheDocument();

    await user.click(await column('Markalar').findByRole('button', { name: 'Renault' }));

    expect(await column('Modeller').findByRole('button', { name: 'Clio' })).toBeInTheDocument();
    expect(state.modelRequests).toEqual(['13']);
    await user.click(column('Modeller').getByRole('button', { name: 'Clio' }));
    expect(await column('Seriler').findByText('1.0 TCe')).toBeInTheDocument();
  });
});
