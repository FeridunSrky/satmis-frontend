import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildListingSummary, buildPage, mockCatalog } from '@/test/listingFixtures';
import { currentPath, renderApp, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

interface SearchLog {
  queries: Array<Record<string, string>>;
}

function mockSearch(results = [buildListingSummary()]): SearchLog {
  const log: SearchLog = { queries: [] };
  server.use(
    mockHttp.get(apiUrl('/listings'), ({ request }) => {
      log.queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(buildPage(results));
    }),
  );
  return log;
}

function lastQuery(log: SearchLog) {
  return log.queries.at(-1);
}

describe('ListingsPage', () => {
  beforeEach(signOutCompletely);

  it('initialLoad_showsResultCardsLinkingToDetail', async () => {
    mockCatalog();
    mockSearch();
    renderApp('/ilanlar');

    const cardLink = await screen.findByRole('link', { name: 'Hatasız 2019 Clio, bakımları yeni' });
    expect(cardLink).toHaveAttribute('href', '/ilan/7');
    expect(screen.getByText('1 ilan bulundu')).toBeInTheDocument();
  });

  it('urlFilters_areSentToBackendWithBackendNames', async () => {
    mockCatalog();
    const searchLog = mockSearch();
    renderApp('/ilanlar?kasa=suv&hasar=yok&sayfa=2');

    await waitFor(() =>
      expect(lastQuery(searchLog)).toEqual({
        bodyType: 'SUV',
        hasDamageRecord: 'false',
        page: '1',
        size: '20',
      }),
    );
  });

  it('selectingFilters_updatesUrlAndQuery_brandChangeClearsModel', async () => {
    mockCatalog();
    const searchLog = mockSearch();
    const { router } = renderApp('/ilanlar?sayfa=3');
    const user = userEvent.setup();
    const filters = within(await screen.findByRole('region', { name: 'Filtreler' }));

    // Catalog options load asynchronously; wait for them like a user would
    await filters.findByRole('option', { name: 'Renault' });
    await user.selectOptions(filters.getByLabelText('Marka'), 'Renault');
    await filters.findByRole('option', { name: 'Clio' });
    await user.selectOptions(filters.getByRole('combobox', { name: 'Model' }), 'Clio');
    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?marka=13&model=131'));
    await waitFor(() =>
      expect(lastQuery(searchLog)).toMatchObject({ brandId: '13', modelId: '131', page: '0' }),
    );

    await user.selectOptions(filters.getByLabelText('Marka'), 'BMW');

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?marka=2'));
    expect(filters.getByRole('combobox', { name: 'Model' })).toHaveValue('');
  });

  it('modelList_isNotRequestedBeforeBrandIsChosen', async () => {
    const catalogLog = mockCatalog();
    mockSearch();
    renderApp('/ilanlar');
    const user = userEvent.setup();

    const modelSelect = await screen.findByRole('combobox', { name: 'Model' });
    await screen.findByRole('option', { name: 'Renault' });
    expect(modelSelect).toBeDisabled();
    expect(catalogLog.modelRequests).toEqual([]);

    await user.selectOptions(screen.getByLabelText('Marka'), 'Renault');

    await waitFor(() => expect(catalogLog.modelRequests).toEqual(['13']));
    expect(catalogLog.seriesRequests).toEqual([]);
  });

  it('noResults_showsEmptyStateThatClearsFilters', async () => {
    mockCatalog();
    const searchLog = mockSearch([]);
    const { router } = renderApp('/ilanlar?yakit=ELECTRIC');
    const user = userEvent.setup();

    expect(await screen.findByText('Aramanıza uygun ilan bulunamadı')).toBeInTheDocument();
    const clearButtons = screen.getAllByRole('button', { name: 'Filtreleri temizle' });
    await user.click(clearButtons.at(-1) ?? clearButtons[0]!);

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar'));
    await waitFor(() => expect(lastQuery(searchLog)).toEqual({ page: '0', size: '20' }));
  });

  it('searchFails_showsBackendMessageWithRetry', async () => {
    mockCatalog();
    server.use(
      mockHttp.get(apiUrl('/listings'), () =>
        HttpResponse.json(
          { status: 400, message: 'Doğrulama hatası', errors: { page: 'Geçersiz değer' } },
          { status: 400 },
        ),
      ),
    );
    renderApp('/ilanlar');

    expect(await screen.findByRole('alert')).toHaveTextContent('Doğrulama hatası');
    expect(screen.getByRole('button', { name: 'Tekrar dene' })).toBeInTheDocument();
  });
});
