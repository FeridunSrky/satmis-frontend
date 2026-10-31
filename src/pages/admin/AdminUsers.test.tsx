import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AdminUser } from '@/features/admin/types';
import { adminUser, buildErrorResponse } from '@/test/fixtures';
import { buildPage } from '@/test/listingFixtures';
import { currentPath, renderApp, signInAs } from '@/test/renderApp';
import { apiUrl, server } from '@/test/server';

function buildAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 5,
    email: 'mehmet@example.com',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    phone: '05551234567',
    role: 'USER',
    enabled: true,
    emailVerified: true,
    createdAt: '2026-10-20T09:30:00Z',
    listingCount: 3,
    ...overrides,
  };
}

/** Serves a mutable user list and records list queries and block calls. */
function mockUsers(users: AdminUser[]) {
  const state = { users, queries: [] as Array<Record<string, string>>, blocked: [] as string[] };
  server.use(
    mockHttp.get(apiUrl('/admin/users'), ({ request }) => {
      state.queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(buildPage(state.users));
    }),
    mockHttp.post(apiUrl('/admin/users/:userId/block'), ({ params }) => {
      state.blocked.push(String(params.userId));
      state.users = state.users.map((user) =>
        String(user.id) === params.userId ? { ...user, enabled: false } : user,
      );
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return state;
}

function rowOf(email: string) {
  const cell = screen.getByRole('cell', { name: email });
  const row = cell.closest('tr');
  if (!row) {
    throw new Error(`No table row for ${email}`);
  }
  return within(row);
}

beforeEach(() => signInAs(1, adminUser));

describe('admin users', () => {
  it('search_sendsQAndKeepsItInUrl', async () => {
    const state = mockUsers([buildAdminUser()]);
    const { router } = renderApp('/admin/kullanicilar');
    const user = userEvent.setup();
    await screen.findByRole('cell', { name: 'mehmet@example.com' });

    await user.type(
      screen.getByRole('searchbox', { name: 'E-posta ile kullanıcı ara' }),
      'mehmet{Enter}',
    );

    await waitFor(() => expect(currentPath(router)).toBe('/admin/kullanicilar?q=mehmet'));
    await waitFor(() =>
      expect(state.queries.at(-1)).toEqual({ q: 'mehmet', page: '0', size: '20' }),
    );
  });

  it('block_asksForConfirmation_thenCallsBlockAndRefreshes', async () => {
    const state = mockUsers([buildAdminUser()]);
    renderApp('/admin/kullanicilar');
    const user = userEvent.setup();
    await screen.findByRole('cell', { name: 'mehmet@example.com' });

    await user.click(rowOf('mehmet@example.com').getByRole('button', { name: 'Engelle' }));
    const dialog = screen.getByRole('alertdialog', { name: 'mehmet@example.com engellensin mi?' });
    expect(dialog).toHaveTextContent('Kullanıcının oturumları kapanacak ve ilanları gizlenecek.');
    expect(state.blocked).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: 'Engelle' }));

    await waitFor(() => expect(state.blocked).toEqual(['5']));
    expect(await rowOf('mehmet@example.com').findByText('Engelli')).toBeInTheDocument();
    expect(
      rowOf('mehmet@example.com').getByRole('button', { name: 'Engeli kaldır' }),
    ).toBeInTheDocument();
  });

  it('adminRow_hasNoBlockButton', async () => {
    mockUsers([buildAdminUser({ id: 9, email: 'yonetici@example.com', role: 'ADMIN' })]);
    renderApp('/admin/kullanicilar');

    const row = await screen.findByRole('cell', { name: 'yonetici@example.com' });
    const cells = within(row.closest('tr') as HTMLTableRowElement);
    expect(cells.getByText('Yönetici')).toBeInTheDocument();
    expect(cells.queryByRole('button')).not.toBeInTheDocument();
  });

  it('blockRejectedByBackend_showsMessage', async () => {
    mockUsers([buildAdminUser()]);
    server.use(
      mockHttp.post(apiUrl('/admin/users/:userId/block'), () =>
        HttpResponse.json(buildErrorResponse(422, 'Yönetici hesapları engellenemez'), {
          status: 422,
        }),
      ),
    );
    renderApp('/admin/kullanicilar');
    const user = userEvent.setup();
    await screen.findByRole('cell', { name: 'mehmet@example.com' });

    await user.click(rowOf('mehmet@example.com').getByRole('button', { name: 'Engelle' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Engelle' }),
    );

    expect(await screen.findByText('Yönetici hesapları engellenemez')).toBeInTheDocument();
  });
});
