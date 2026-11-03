import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { MyComment } from '@/features/comments/types';
import { buildMyComment, PDF_ATTACHMENT } from '@/test/commentFixtures';
import { confirmDialog } from '@/test/dialogHelpers';
import { buildErrorResponse } from '@/test/fixtures';
import { buildPage } from '@/test/listingFixtures';
import { renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

function mockMyComments(comments: MyComment[]) {
  const state = { requests: 0 };
  server.use(
    mockHttp.get(apiUrl('/users/me/comments'), () => {
      state.requests += 1;
      return HttpResponse.json(buildPage(comments));
    }),
  );
  return state;
}

function recordDeletes(status: 204 | 404) {
  const deleted: string[] = [];
  server.use(
    mockHttp.delete(apiUrl('/comments/:id'), ({ params }) => {
      deleted.push(String(params.id));
      return status === 204
        ? new HttpResponse(null, { status })
        : HttpResponse.json(buildErrorResponse(status, 'Yorum bulunamadı'), { status });
    }),
  );
  return deleted;
}

beforeEach(() => signInAs(1));

describe('my comments page', () => {
  it('showsStatusKindRejectionReasonAndListingLink', async () => {
    mockMyComments([
      buildMyComment({ id: 41, attachments: [PDF_ATTACHMENT] }),
      buildMyComment({
        id: 42,
        parentId: 21,
        status: 'REJECTED',
        rejectionReason: 'Ekte plaka görünüyor',
      }),
      buildMyComment({ id: 43, status: 'APPROVED' }),
    ]);
    renderApp('/yorumlarim');

    const [pending, rejected, approved] = await screen.findAllByRole('article');
    expect(within(pending!).getByText('Onay bekliyor')).toBeInTheDocument();
    expect(within(pending!).getByText('Yorum')).toBeInTheDocument();
    expect(within(pending!).getByText('1 ek')).toBeInTheDocument();
    expect(
      within(pending!).getByRole('link', { name: 'Hatasız 2019 Clio, bakımları yeni' }),
    ).toHaveAttribute('href', '/ilan/7');
    expect(within(rejected!).getByText('Reddedildi')).toBeInTheDocument();
    expect(within(rejected!).getByText('Cevap')).toBeInTheDocument();
    expect(within(rejected!).getByText('Red nedeni: Ekte plaka görünüyor')).toBeInTheDocument();
    expect(within(approved!).getByText('Yayında')).toBeInTheDocument();
  });

  it('longText_isCutWithAToggle', async () => {
    mockMyComments([buildMyComment({ body: `${'Uzun yorum metni. '.repeat(30)}SON` })]);
    const user = userEvent.setup();
    renderApp('/yorumlarim');

    const toggle = await screen.findByRole('button', { name: 'devamı' });
    expect(screen.queryByText(/SON$/)).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByText(/SON$/)).toBeInTheDocument();
  });

  it('delete_asksFirst_thenDeletesAndReloads', async () => {
    const list = mockMyComments([buildMyComment({ id: 41 })]);
    const deleted = recordDeletes(204);
    const user = userEvent.setup();
    renderApp('/yorumlarim');

    await user.click(await screen.findByRole('button', { name: 'Sil' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Yorum silinecek. Yorum hakkınız geri gelmez. Yorumun altındaki cevap da silinir.',
    );
    expect(deleted).toEqual([]);
    await confirmDialog(user, 'Sil');

    await waitFor(() => expect(deleted).toEqual(['41']));
    expect(await screen.findByText('Yorum silindi')).toBeInTheDocument();
    await waitFor(() => expect(list.requests).toBe(2));
  });

  it('deleteAnsweredWith404_countsAsDeleted', async () => {
    mockMyComments([buildMyComment({ id: 41 })]);
    recordDeletes(404);
    const user = userEvent.setup();
    renderApp('/yorumlarim');

    await user.click(await screen.findByRole('button', { name: 'Sil' }));
    await confirmDialog(user, 'Sil');

    expect(await screen.findByText('Yorum silindi')).toBeInTheDocument();
  });

  it('noComments_showsEmptyState', async () => {
    mockMyComments([]);
    renderApp('/yorumlarim');

    expect(await screen.findByText('Henüz yorum yazmadınız.')).toBeInTheDocument();
  });

  it('userMenu_linksToMyComments', async () => {
    mockMyComments([]);
    const user = userEvent.setup();
    renderApp('/yorumlarim');

    await user.click(await screen.findByRole('button', { name: /Ayşe Yılmaz/ }));
    expect(screen.getAllByRole('link', { name: 'Yorumlarım' })[0]).toHaveAttribute(
      'href',
      '/yorumlarim',
    );
  });
});
