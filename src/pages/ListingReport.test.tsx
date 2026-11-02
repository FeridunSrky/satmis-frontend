import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { buildErrorResponse } from '@/test/fixtures';
import { buildListingDetail, ownListingOverrides } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

const REPORT_BUTTON = { name: 'İlanı şikayet et' };

function mockDetail(overrides = {}) {
  const listing = buildListingDetail(overrides);
  server.use(mockHttp.get(apiUrl('/listings/7'), () => HttpResponse.json(listing)));
}

/** Records report bodies and answers each with the given response. */
function mockReport(answer: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    mockHttp.post(apiUrl('/listings/7/reports'), async ({ request }) => {
      bodies.push(await request.json());
      return answer();
    }),
  );
  return bodies;
}

const created = () =>
  HttpResponse.json(
    {
      id: 1,
      listingId: 7,
      reason: 'OTHER',
      description: 'x',
      status: 'OPEN',
      createdAt: '2026-10-31T10:00:00Z',
    },
    { status: 201 },
  );

async function openReportDialog() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', REPORT_BUTTON));
  return { user, dialog: screen.getByRole('dialog', { name: 'İlanı şikayet et' }) };
}

describe('listing report', () => {
  it('owner_doesNotSeeReportButton', async () => {
    signInAs(1);
    mockDetail(ownListingOverrides);
    renderApp('/ilan/7');

    expect(await screen.findByRole('button', { name: 'Yayından kaldır' })).toBeInTheDocument();
    expect(screen.queryByRole('button', REPORT_BUTTON)).not.toBeInTheDocument();
  });

  it('anonymousVisitor_isSentToLoginAndBack', async () => {
    signOutCompletely();
    mockDetail();
    const { router } = renderApp('/ilan/7');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', REPORT_BUTTON));

    await waitFor(() => expect(currentPath(router)).toBe('/giris?next=%2Filan%2F7'));
  });

  it('form_validatesReasonAndOther_thenSendsTrimmedDescription', async () => {
    signInAs(1);
    mockDetail();
    const bodies = mockReport(created);
    renderApp('/ilan/7');
    const { user, dialog } = await openReportDialog();
    const form = within(dialog);

    await user.click(form.getByRole('button', { name: 'Gönder' }));
    expect(await form.findByText('Bir neden seçin')).toBeInTheDocument();

    await user.click(form.getByRole('radio', { name: 'Diğer' }));
    await user.click(form.getByRole('button', { name: 'Gönder' }));
    expect(await form.findByText('"Diğer" seçildiğinde açıklama zorunludur')).toBeInTheDocument();
    expect(bodies).toEqual([]);

    await user.type(form.getByLabelText('Açıklama'), '  Fotoğraflar başka araca ait  ');
    await user.click(form.getByRole('button', { name: 'Gönder' }));

    expect(await screen.findByText('Şikayetiniz alındı, incelenecek.')).toBeInTheDocument();
    expect(bodies).toEqual([{ reason: 'OTHER', description: 'Fotoğraflar başka araca ait' }]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Şikayet edildi' })).toBeDisabled();
  });

  it('reasonWithoutDescription_sendsNoDescription', async () => {
    signInAs(1);
    mockDetail();
    const bodies = mockReport(created);
    renderApp('/ilan/7');
    const { user, dialog } = await openReportDialog();

    await user.click(within(dialog).getByRole('radio', { name: 'Dolandırıcılık şüphesi' }));
    await user.click(within(dialog).getByRole('button', { name: 'Gönder' }));

    await waitFor(() => expect(bodies).toEqual([{ reason: 'FRAUD_SUSPECTED' }]));
  });

  it('alreadyReported_showsInfoAndMarksButton', async () => {
    signInAs(1);
    mockDetail();
    mockReport(() =>
      HttpResponse.json(buildErrorResponse(409, 'Bu ilanı zaten şikayet ettiniz, inceleniyor'), {
        status: 409,
      }),
    );
    renderApp('/ilan/7');
    const { user, dialog } = await openReportDialog();

    await user.click(within(dialog).getByRole('radio', { name: 'Araç satılmış' }));
    await user.click(within(dialog).getByRole('button', { name: 'Gönder' }));

    expect(
      await screen.findByText('Bu ilanı zaten şikayet ettiniz, inceleniyor'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Şikayet edildi' })).toBeDisabled();
  });

  it('listingGone_showsNotPublishedMessage', async () => {
    signInAs(1);
    mockDetail();
    mockReport(() =>
      HttpResponse.json(buildErrorResponse(404, 'İlan bulunamadı'), { status: 404 }),
    );
    renderApp('/ilan/7');
    const { user, dialog } = await openReportDialog();

    await user.click(within(dialog).getByRole('radio', { name: 'Uygunsuz içerik' }));
    await user.click(within(dialog).getByRole('button', { name: 'Gönder' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Bu ilan artık yayında değil.',
    );
  });
});
