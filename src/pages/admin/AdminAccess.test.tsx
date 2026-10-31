import { screen, waitFor, within } from '@testing-library/react';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { adminUser, buildErrorResponse } from '@/test/fixtures';
import { buildPage } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs, signOutCompletely } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

function mockEmptyQueue() {
  server.use(mockHttp.get(apiUrl('/admin/listings'), () => HttpResponse.json(buildPage([]))));
}

describe('admin access', () => {
  it('regularUser_isSentHome_andSeesNoAdminLink', async () => {
    signInAs(1);
    const { router } = renderApp('/admin/ilanlar');

    await waitFor(() => expect(currentPath(router)).toBe('/'));
    const mainMenu = screen.getByRole('navigation', { name: 'Ana menü' });
    expect(within(mainMenu).queryByRole('link', { name: 'Yönetim' })).not.toBeInTheDocument();
  });

  it('anonymousVisitor_isSentToLogin', async () => {
    signOutCompletely();
    const { router } = renderApp('/admin/kullanicilar');

    await waitFor(() => expect(currentPath(router)).toMatch(/^\/giris\?next=/));
  });

  it('admin_seesLink_andAdminRootOpensListingQueue', async () => {
    signInAs(1, adminUser);
    mockEmptyQueue();
    const { router } = renderApp('/admin');

    await waitFor(() => expect(currentPath(router)).toBe('/admin/ilanlar'));
    expect(await screen.findByText('Onay bekleyen ilan yok.')).toBeInTheDocument();
    const mainMenu = screen.getByRole('navigation', { name: 'Ana menü' });
    expect(within(mainMenu).getByRole('link', { name: 'Yönetim' })).toHaveAttribute(
      'href',
      '/admin',
    );
    const sections = screen.getByRole('navigation', { name: 'Yönetim bölümleri' });
    expect(within(sections).getByRole('link', { name: 'İlan onayı' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('backendForbids_adminSectionIsLeft', async () => {
    signInAs(1, adminUser);
    server.use(
      mockHttp.get(apiUrl('/admin/listings'), () =>
        HttpResponse.json(buildErrorResponse(403, 'Erişim reddedildi'), { status: 403 }),
      ),
    );
    const { router } = renderApp('/admin/ilanlar');

    await waitFor(() => expect(currentPath(router)).toBe('/'));
  });
});
