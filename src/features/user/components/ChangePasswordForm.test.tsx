import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { readRefreshToken } from '@/features/auth/tokenStorage';
import { buildErrorResponse, testUser } from '@/test/fixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

async function submitPasswordChange(currentPassword: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Mevcut şifre'), currentPassword);
  await user.type(screen.getByLabelText('Yeni şifre'), 'YeniSifre456');
  await user.type(screen.getByLabelText('Yeni şifre (tekrar)'), 'YeniSifre456');
  await user.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }));
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    signInAs(1);
    server.use(
      mockHttp.get(apiUrl('/users/me'), () => HttpResponse.json(testUser)),
      mockHttp.post(apiUrl('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
    );
  });

  it('submit_success_logsOutAndAsksToSignInAgain', async () => {
    server.use(
      mockHttp.put(apiUrl('/users/me/password'), () => new HttpResponse(null, { status: 204 })),
    );
    const { router } = renderApp('/profil');

    await submitPasswordChange('EskiSifre123');

    expect(
      await screen.findByText('Şifreniz değişti, lütfen tekrar giriş yapın'),
    ).toBeInTheDocument();
    await waitFor(() => expect(currentPath(router)).toBe('/giris?next=%2Fprofil'));
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(readRefreshToken()).toBeNull();
  });

  it('submit_wrongCurrentPassword_showsErrorOnCurrentPasswordField', async () => {
    server.use(
      mockHttp.put(apiUrl('/users/me/password'), () =>
        HttpResponse.json(buildErrorResponse(400, 'Mevcut şifre hatalı'), { status: 400 }),
      ),
    );
    renderApp('/profil');

    await submitPasswordChange('YanlisSifre1');

    expect(await screen.findByText('Mevcut şifre hatalı')).toBeInTheDocument();
    expect(screen.getByLabelText('Mevcut şifre')).toHaveAttribute('aria-invalid', 'true');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
