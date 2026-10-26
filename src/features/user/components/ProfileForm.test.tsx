import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { UpdateProfileRequest } from '@/shared/api/types';
import { buildErrorResponse, testUser } from '@/test/fixtures';
import { renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

describe('ProfileForm phone', () => {
  beforeEach(() => signInAs(1));

  it('clearingPhone_isRejectedBeforeRequest', async () => {
    let requestCount = 0;
    server.use(
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
      mockHttp.put(apiUrl('/users/me'), () => {
        requestCount += 1;
        return HttpResponse.json(testUser);
      }),
    );
    renderApp('/profil');
    const user = userEvent.setup();

    await user.clear(await screen.findByLabelText('Telefon'));
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));

    expect(await screen.findByText('Telefon numarası zorunludur')).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it('accountWithoutPhone_canAddOne', async () => {
    let sentBody: UpdateProfileRequest | undefined;
    server.use(
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json({ ...testUser, phone: null })),
      mockHttp.put(apiUrl('/users/me'), async ({ request }) => {
        sentBody = (await request.json()) as UpdateProfileRequest;
        return HttpResponse.json({ ...testUser, phone: sentBody.phone });
      }),
    );
    renderApp('/profil');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Telefon'), '0532 123 45 67');
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));

    await waitFor(() => expect(sentBody?.phone).toBe('05321234567'));
  });

  it('backendPhoneError_isShownOnField', async () => {
    server.use(
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
      mockHttp.put(apiUrl('/users/me'), () =>
        HttpResponse.json(
          buildErrorResponse(400, 'Doğrulama hatası', { phone: 'Telefon numarası geçersiz' }),
          { status: 400 },
        ),
      ),
    );
    renderApp('/profil');
    const user = userEvent.setup();

    const phoneField = await screen.findByLabelText('Telefon');
    await user.clear(phoneField);
    await user.type(phoneField, '05551112233');
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }));

    expect(await screen.findByText('Telefon numarası geçersiz')).toBeInTheDocument();
    expect(phoneField).toHaveAttribute('aria-invalid', 'true');
  });
});
