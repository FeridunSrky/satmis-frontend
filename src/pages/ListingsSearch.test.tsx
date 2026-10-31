import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildListingSummary, buildPage, mockCatalog } from '@/test/listingFixtures';
import { currentPath, renderApp, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

type SearchQueryLog = Array<Record<string, string>>;

function mockSearch(results = [buildListingSummary()], totalPages = 1): SearchQueryLog {
  const queries: SearchQueryLog = [];
  server.use(
    mockHttp.get(apiUrl('/listings'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(buildPage(results, totalPages));
    }),
  );
  return queries;
}

function searchBox() {
  return screen.getByRole('searchbox', { name: 'İlanlarda ara' });
}

async function openListings(path: string, queries: SearchQueryLog) {
  mockCatalog();
  const view = renderApp(path);
  await waitFor(() => expect(queries.length).toBeGreaterThan(0));
  return { ...view, user: userEvent.setup() };
}

describe('ListingsPage keyword search', () => {
  beforeEach(signOutCompletely);

  it('submitWithEnter_sendsKeywordAndPutsItInUrl', async () => {
    const queries = mockSearch();
    const { router, user } = await openListings('/ilanlar', queries);

    await user.type(searchBox(), 'passat dizel{Enter}');

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=passat+dizel'));
    await waitFor(() =>
      expect(queries.at(-1)).toEqual({ q: 'passat dizel', page: '0', size: '20' }),
    );
  });

  it('keyword_isTrimmed_andBlankSearchRemovesIt', async () => {
    const queries = mockSearch();
    const { router, user } = await openListings('/ilanlar', queries);

    await user.type(searchBox(), '  golf  ');
    await user.click(screen.getByRole('button', { name: 'Ara' }));
    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=golf'));
    await waitFor(() => expect(queries.at(-1)?.q).toBe('golf'));
    expect(searchBox()).toHaveValue('golf');

    await user.clear(searchBox());
    await user.type(searchBox(), '   {Enter}');

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar'));
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '20' }));
    expect(searchBox()).toHaveValue('');
  });

  it('keywordFromUrl_fillsInput_andSurvivesSortAndPaging', async () => {
    const queries = mockSearch([buildListingSummary()], 3);
    const { router, user } = await openListings('/ilanlar?q=golf&il=34&sayfa=2', queries);

    expect(searchBox()).toHaveValue('golf');
    expect(queries.at(-1)).toMatchObject({ q: 'golf', cityId: '34', page: '1' });

    await user.click(await screen.findByRole('link', { name: /Sonraki/ }));
    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=golf&il=34&sayfa=3'));

    await user.selectOptions(screen.getByLabelText('Sıralama'), 'PRICE_ASC');
    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=golf&il=34&sirala=PRICE_ASC'));
    await waitFor(() => expect(queries.at(-1)).toMatchObject({ q: 'golf', sort: 'PRICE_ASC' }));
  });

  it('newSearch_returnsToFirstPage_keepingFiltersAndSort', async () => {
    const queries = mockSearch([buildListingSummary()], 3);
    const { router, user } = await openListings(
      '/ilanlar?q=golf&kasa=suv&sirala=KM_ASC&sayfa=2',
      queries,
    );

    await user.clear(searchBox());
    await user.type(searchBox(), 'passat{Enter}');

    await waitFor(() =>
      expect(currentPath(router)).toBe('/ilanlar?q=passat&kasa=suv&sirala=KM_ASC'),
    );
    await waitFor(() =>
      expect(queries.at(-1)).toMatchObject({
        q: 'passat',
        bodyType: 'SUV',
        sort: 'KM_ASC',
        page: '0',
      }),
    );
  });

  it('turkishLetters_areSentUnchanged', async () => {
    const queries = mockSearch();
    const { user } = await openListings('/ilanlar', queries);

    await user.type(searchBox(), 'IŞIKLI çağdaş{Enter}');

    await waitFor(() => expect(queries.at(-1)?.q).toBe('IŞIKLI çağdaş'));
  });

  it('typing_sendsNoRequestUntilSubmitted', async () => {
    const queries = mockSearch();
    const { user } = await openListings('/ilanlar', queries);
    const requestsBeforeTyping = queries.length;

    await user.type(searchBox(), 'passat dizel');

    expect(queries).toHaveLength(requestsBeforeTyping);
  });

  it('noResults_showsKeywordMessage_andClearButtonRemovesKeyword', async () => {
    const queries = mockSearch([]);
    const { router, user } = await openListings('/ilanlar?q=uçan+araba&sirala=PRICE_ASC', queries);

    expect(await screen.findByText('“uçan araba” için ilan bulunamadı.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aramayı temizle' }));

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?sirala=PRICE_ASC'));
    expect(searchBox()).toHaveValue('');
  });

  it('filterPanelClear_keepsKeyword', async () => {
    const queries = mockSearch();
    const { router, user } = await openListings('/ilanlar?q=golf&yakit=LPG', queries);

    await user.click(screen.getByRole('button', { name: 'Filtreleri temizle' }));

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=golf'));
    expect(searchBox()).toHaveValue('golf');
  });

  it('backButton_restoresPreviousKeywordInInput', async () => {
    const queries = mockSearch();
    const { router, user } = await openListings('/ilanlar?q=audi', queries);

    await user.clear(searchBox());
    await user.type(searchBox(), 'bmw{Enter}');
    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=bmw'));

    await act(() => router.navigate(-1));

    await waitFor(() => expect(searchBox()).toHaveValue('audi'));
    expect(queries.at(-1)?.q).toBe('audi');
  });

  it('keywordRejectedByBackend_showsFieldErrorUnderInput', async () => {
    mockCatalog();
    server.use(
      mockHttp.get(apiUrl('/listings'), () =>
        HttpResponse.json(
          { status: 400, message: 'Doğrulama hatası', errors: { q: 'En fazla 100 karakter' } },
          { status: 400 },
        ),
      ),
    );
    renderApp('/ilanlar?q=golf');

    expect(await screen.findByText('En fazla 100 karakter')).toBeInTheDocument();
    expect(searchBox()).toHaveAccessibleDescription('En fazla 100 karakter');
  });

  it('headerSearch_onAnotherPage_opensListingsWithKeyword', async () => {
    const queries = mockSearch();
    mockCatalog();
    const { router } = renderApp('/giris');
    const user = userEvent.setup();

    await user.type(await screen.findByRole('searchbox', { name: 'İlanlarda ara' }), 'clio{Enter}');

    await waitFor(() => expect(currentPath(router)).toBe('/ilanlar?q=clio'));
    await waitFor(() => expect(queries.at(-1)?.q).toBe('clio'));
  });
});
