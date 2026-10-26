import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RegisterRequest } from '@/shared/api/types';
import { buildAuthResponse, buildErrorResponse } from '@/test/fixtures';
import { currentPath, renderApp, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';
import { useAuthStore } from '../authStore';

async function fillRegisterForm({ phone = '' }: { phone?: string } = {}) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Ad'), 'Ayşe');
  await user.type(screen.getByLabelText('Soyad'), 'Yılmaz');
  await user.type(screen.getByLabelText('E-posta'), 'ayse@example.com');
  if (phone) await user.type(screen.getByLabelText('Telefon (isteğe bağlı)'), phone);
  await user.type(screen.getByLabelText('Şifre'), 'GizliSifre123');
  await user.click(screen.getByRole('button', { name: 'Hesap oluştur' }));
}

describe('RegisterForm', () => {
  beforeEach(signOutCompletely);

  it('submit_emailAlreadyRegistered_showsErrorOnEmailField', async () => {
    server.use(
      mockHttp.post(apiUrl('/auth/register'), () =>
        HttpResponse.json(buildErrorResponse(409, 'Kayıt çakışması: bu veri zaten mevcut'), {
          status: 409,
        }),
      ),
    );
    renderApp('/kayit');

    await fillRegisterForm();

    expect(
      await screen.findByText('Bu e-posta adresiyle kayıtlı bir hesap var'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toHaveAttribute('aria-invalid', 'true');
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('submit_backendValidationErrors_mapsThemToFields', async () => {
    server.use(
      mockHttp.post(apiUrl('/auth/register'), () =>
        HttpResponse.json(
          buildErrorResponse(400, 'Doğrulama hatası', {
            firstName: 'Ad geçersiz karakter içeriyor',
          }),
          { status: 400 },
        ),
      ),
    );
    renderApp('/kayit');

    await fillRegisterForm();

    expect(await screen.findByText('Ad geçersiz karakter içeriyor')).toBeInTheDocument();
    expect(screen.getByLabelText('Ad')).toHaveAttribute('aria-invalid', 'true');
  });

  it('submit_success_normalisesPhoneAndSignsIn', async () => {
    let sentBody: RegisterRequest | undefined;
    server.use(
      mockHttp.post(apiUrl('/auth/register'), async ({ request }) => {
        sentBody = (await request.json()) as RegisterRequest;
        return HttpResponse.json(buildAuthResponse(1), { status: 201 });
      }),
    );
    const { router } = renderApp('/kayit');

    await fillRegisterForm({ phone: '0532 123 45 67' });

    await waitFor(() => expect(currentPath(router)).toBe('/'));
    expect(sentBody?.phone).toBe('05321234567');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('submit_emptyPhone_omitsPhoneFromRequest', async () => {
    let sentBody: Record<string, unknown> = {};
    server.use(
      mockHttp.post(apiUrl('/auth/register'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(buildAuthResponse(1), { status: 201 });
      }),
    );
    renderApp('/kayit');

    await fillRegisterForm();

    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(sentBody).not.toHaveProperty('phone');
  });
});
