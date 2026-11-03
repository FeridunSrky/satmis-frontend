import { screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListingDetail } from '@/features/listings/types';
import {
  buildListingComment,
  buildMyComment,
  errorWithCode,
  LONG_ENOUGH_TEXT,
  mockCommentQuota,
  mockListingComments,
  recordJsonPost,
} from '@/test/commentFixtures';
import { confirmDialog } from '@/test/dialogHelpers';
import { unverifiedUser } from '@/test/fixtures';
import { installImageFakes, mockImageBackend } from '@/test/imageMocks';
import { buildListingDetail, ownListingOverrides } from '@/test/listingFixtures';
import { renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const PDF_HEADERS = {
  'content-type': 'application/pdf',
  'content-disposition': 'attachment',
  'cache-control': 'max-age=31536000',
};

function mockListing(overrides: Partial<ListingDetail> = {}) {
  server.use(
    mockHttp.get(apiUrl('/listings/7'), () => HttpResponse.json(buildListingDetail(overrides))),
  );
}

async function openListing() {
  renderApp('/ilan/7');
  await screen.findByRole('heading', { name: /^Yorumlar/ });
  return userEvent.setup();
}

async function writeComment(user: UserEvent, text: string) {
  await user.click(await screen.findByLabelText('Yorumunuz'));
  await user.paste(text);
}

afterEach(() => vi.unstubAllGlobals());

describe('listing comments: reading', () => {
  beforeEach(() => {
    signOutCompletely();
    mockListing();
  });

  it('approvedComments_showMaskedNameOwnerReplyAndPdfDownload', async () => {
    mockListingComments([
      buildListingComment({
        reply: {
          id: 22,
          body: 'Boya bilgisi ekspertiz raporunda var.',
          attachments: [],
          createdAt: '2026-11-02T09:00:00Z',
        },
      }),
    ]);
    await openListing();

    const comments = await screen.findByRole('region', { name: 'Yorumlar (1)' });
    const comment = within(comments).getByRole('article');
    expect(within(comment).getByText('Ayşe Y.')).toBeInTheDocument();
    expect(within(comment).getByText(/Sağ çamurluk boyalı/)).toBeInTheDocument();
    const pdfLink = within(comment).getByRole('link', { name: 'Ekspertiz/Belge (PDF, 1,2 MB)' });
    expect(pdfLink).toHaveAttribute('download');
    expect(pdfLink).toHaveAttribute('href', 'https://cdn.example.com/comments/31.pdf');
    expect(pdfLink).toHaveAttribute('rel', 'noopener noreferrer');
    const reply = within(comment).getByRole('region', { name: 'İlan sahibinin cevabı' });
    expect(within(reply).getByText('İlan sahibi')).toBeInTheDocument();
    expect(within(reply).getByText('Boya bilgisi ekspertiz raporunda var.')).toBeInTheDocument();
  });

  it('noComments_showsEmptyState', async () => {
    mockListingComments([]);
    await openListing();

    expect(await screen.findByRole('heading', { name: 'Yorumlar (0)' })).toBeInTheDocument();
    expect(await screen.findByText('Henüz yorum yok.')).toBeInTheDocument();
  });
});

describe('listing comments: who may write', () => {
  beforeEach(() => mockListingComments([]));

  it('anonymous_seesLoginLinkWithReturnPath', async () => {
    signOutCompletely();
    mockListing();
    await openListing();

    expect(screen.getByRole('link', { name: 'Yorum yazmak için giriş yapın' })).toHaveAttribute(
      'href',
      '/giris?next=%2Filan%2F7',
    );
    expect(screen.queryByLabelText('Yorumunuz')).not.toBeInTheDocument();
  });

  it('owner_isToldToReplyInstead', async () => {
    signInAs(1);
    mockListing(ownListingOverrides);
    await openListing();

    expect(screen.getByText('Gelen yorumlara cevap verebilirsiniz.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Yorumunuz')).not.toBeInTheDocument();
  });

  it('unverifiedUser_seesVerificationAlertInsteadOfForm', async () => {
    signInAs(1, unverifiedUser);
    mockListing();
    await openListing();

    expect(screen.getByRole('alert')).toHaveTextContent(/Yorum yazmak için e-posta adresini/);
    expect(screen.queryByLabelText('Yorumunuz')).not.toBeInTheDocument();
  });

  it('quotaUsedUp_saysSoInsteadOfForm', async () => {
    signInAs(1);
    mockListing();
    mockCommentQuota(0);
    await openListing();

    expect(
      await screen.findByText('Bu ilana yorum hakkınız doldu (en fazla 2)'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Yorumunuz')).not.toBeInTheDocument();
  });

  it('soldListing_hasNoForm', async () => {
    signInAs(1);
    mockListing({ status: 'SOLD' });
    await openListing();

    expect(await screen.findByText('Henüz yorum yok.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Yorumunuz')).not.toBeInTheDocument();
  });
});

describe('listing comments: writing', () => {
  beforeEach(() => {
    signInAs(1);
    mockListing();
    mockListingComments([]);
    mockCommentQuota(2);
  });

  it('textShorterThanTwentyAfterTrimming_sendsNothing', async () => {
    const sent = recordJsonPost('/listings/7/comments', () =>
      HttpResponse.json(buildMyComment(), { status: 201 }),
    );
    const user = await openListing();
    expect(await screen.findByText('Kalan yorum hakkınız: 2')).toBeInTheDocument();

    await writeComment(user, `   ${'a'.repeat(19)}            `);
    await user.click(screen.getByRole('button', { name: 'Gönder' }));

    expect(await screen.findByText('En az 20 karakter yazın')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('pdfAttachment_uploadsWithSignedHeaders_thenCommentIsSentAfterConfirming', async () => {
    installImageFakes();
    const { log } = mockImageBackend({
      endpoint: '/comment-attachments',
      uploadHeadersFor: () => PDF_HEADERS,
    });
    const sent = recordJsonPost('/listings/7/comments', () =>
      HttpResponse.json(buildMyComment({ attachments: [] }), { status: 201 }),
    );
    const user = await openListing();
    const pdf = new File([new Uint8Array(1234)], 'ekspertiz.pdf', { type: 'application/pdf' });

    await writeComment(user, LONG_ENOUGH_TEXT);
    await user.upload(screen.getByLabelText('Dosya ekle'), pdf);

    expect(await screen.findByText('ekspertiz.pdf')).toBeInTheDocument();
    await waitFor(() => expect(log.completes).toEqual([101]));
    expect(log.reservations).toEqual([
      { id: 101, contentType: 'application/pdf', sizeBytes: 1234 },
    ]);
    const [put] = log.puts;
    expect(put?.size).toBe(1234);
    expect(put?.headers.get('content-disposition')).toBe('attachment');
    expect(put?.headers.get('content-type')).toBe('application/pdf');
    expect(put?.headers.get('cache-control')).toBe(PDF_HEADERS['cache-control']);
    expect(put?.headers.get('authorization')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Gönder' }));
    expect(sent).toEqual([]);
    await confirmDialog(user, 'Gönder');

    await waitFor(() => expect(sent).toEqual([{ body: LONG_ENOUGH_TEXT, attachmentIds: [101] }]));
    expect(await screen.findAllByText('Yorumunuz incelemeye gönderildi')).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Yorumlarım' })).toHaveAttribute('href', '/yorumlarim');
    expect(screen.queryByText(LONG_ENOUGH_TEXT)).not.toBeInTheDocument();
    expect(screen.getByText('Henüz yorum yok.')).toBeInTheDocument();
  });

  it('commentLimitReached_showsMessageAndClosesForm', async () => {
    recordJsonPost('/listings/7/comments', () =>
      errorWithCode(409, 'Bu ilana en fazla 2 yorum yazabilirsiniz', 'COMMENT_LIMIT_REACHED'),
    );
    const user = await openListing();

    await writeComment(user, LONG_ENOUGH_TEXT);
    await user.click(screen.getByRole('button', { name: 'Gönder' }));
    await confirmDialog(user, 'Gönder');

    expect(await screen.findByText('Bu ilana en fazla 2 yorum yazabilirsiniz')).toBeInTheDocument();
    expect(screen.queryByLabelText('Yorumunuz')).not.toBeInTheDocument();
  });

  it('attachmentNotAvailable_asksToUploadAgainAndClearsAttachments', async () => {
    installImageFakes();
    const { log } = mockImageBackend({
      endpoint: '/comment-attachments',
      uploadHeadersFor: () => PDF_HEADERS,
    });
    recordJsonPost('/listings/7/comments', () =>
      errorWithCode(422, 'Ek kullanılamıyor', 'ATTACHMENT_NOT_AVAILABLE'),
    );
    const user = await openListing();
    const pdf = new File([new Uint8Array(500)], 'rapor.pdf', { type: 'application/pdf' });

    await writeComment(user, LONG_ENOUGH_TEXT);
    await user.upload(screen.getByLabelText('Dosya ekle'), pdf);
    await waitFor(() => expect(log.completes).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: 'Gönder' }));
    await confirmDialog(user, 'Gönder');

    expect(
      await screen.findByText('Eklerden biri kullanılamıyor, yeniden yükleyin'),
    ).toBeInTheDocument();
    expect(screen.getByText('0/5 dosya')).toBeInTheDocument();
    expect(screen.getByLabelText('Yorumunuz')).toHaveValue(LONG_ENOUGH_TEXT);
  });

  it('pdfOverTenMegabytes_isRefusedBeforeUploading', async () => {
    installImageFakes();
    const { log } = mockImageBackend({ endpoint: '/comment-attachments' });
    const user = await openListing();
    const bigPdf = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'buyuk.pdf', {
      type: 'application/pdf',
    });

    await user.upload(await screen.findByLabelText('Dosya ekle'), bigPdf);

    expect(await screen.findByText('Dosya en fazla 10 MB olabilir')).toBeInTheDocument();
    expect(log.reservations).toEqual([]);
  });
});

describe('listing comments: owner replies', () => {
  beforeEach(() => {
    signInAs(1);
    mockListing(ownListingOverrides);
    mockListingComments([
      buildListingComment({ id: 21, canReply: true, attachments: [] }),
      buildListingComment({ id: 23, authorName: 'Can K.', canReply: false, attachments: [] }),
    ]);
  });

  it('replyButtonOnlyWhereAllowed_andReplyIsPostedToTheComment', async () => {
    const sent = recordJsonPost('/comments/21/reply', () =>
      HttpResponse.json(buildMyComment({ parentId: 21 }), { status: 201 }),
    );
    const user = await openListing();

    const [replyable, answered] = await screen.findAllByRole('article');
    expect(within(answered!).queryByRole('button', { name: 'Cevap yaz' })).not.toBeInTheDocument();
    await user.click(within(replyable!).getByRole('button', { name: 'Cevap yaz' }));
    expect(screen.getByText(/Her yoruma bir cevap hakkınız var/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Cevabınız'));
    await user.paste('Boya ekspertiz raporunda yazıyor, rapor ektedir.');
    await user.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
    await confirmDialog(user, 'Gönder');

    await waitFor(() =>
      expect(sent).toEqual([{ body: 'Boya ekspertiz raporunda yazıyor, rapor ektedir.' }]),
    );
    expect(await screen.findByText('Cevabınız incelemeye gönderildi')).toBeInTheDocument();
  });

  it('replyLimitReached_saysNoRepliesLeft', async () => {
    recordJsonPost('/comments/21/reply', () =>
      errorWithCode(409, 'Cevap hakkı doldu', 'REPLY_LIMIT_REACHED'),
    );
    const user = await openListing();

    await user.click(await screen.findByRole('button', { name: 'Cevap yaz' }));
    await user.click(screen.getByLabelText('Cevabınız'));
    await user.paste('Boya ekspertiz raporunda yazıyor, rapor ektedir.');
    await user.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
    await confirmDialog(user, 'Gönder');

    expect(await screen.findByText('Bu yoruma cevap hakkınız kalmadı')).toBeInTheDocument();
  });
});
