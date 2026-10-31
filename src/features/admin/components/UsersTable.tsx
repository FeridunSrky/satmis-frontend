import { formatDateTime, formatNumber, formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import type { AdminUser } from '../types';
import { UserStatusAction } from './UserStatusAction';

const ROLE_LABELS = { USER: 'Kullanıcı', ADMIN: 'Yönetici' } as const;
const COLUMNS = [
  'Ad soyad',
  'E-posta',
  'Telefon',
  'Rol',
  'E-posta doğrulandı',
  'İlan',
  'Kayıt tarihi',
  'Durum',
  'İşlem',
] as const;

const cellClassName = 'px-3 py-3 align-middle whitespace-nowrap';

// Wide on purpose: on small screens the wrapper scrolls sideways instead of squeezing columns
export function UsersTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Kullanıcılar</caption>
        <thead className="border-b border-line bg-surface text-xs text-muted uppercase">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={cellClassName}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <tr>
      <th scope="row" className={cn(cellClassName, 'font-semibold')}>
        {user.firstName} {user.lastName}
      </th>
      <td className={cellClassName}>{user.email}</td>
      <td className={cellClassName}>{user.phone ? formatPhone(user.phone) : '—'}</td>
      <td className={cellClassName}>{ROLE_LABELS[user.role]}</td>
      <td className={cellClassName}>{user.emailVerified ? 'Evet' : 'Hayır'}</td>
      <td className={cellClassName}>{formatNumber(user.listingCount)}</td>
      <td className={cellClassName}>{formatDateTime(user.createdAt)}</td>
      <td className={cellClassName}>
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
            user.enabled ? 'bg-success/10 text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {user.enabled ? 'Aktif' : 'Engelli'}
        </span>
      </td>
      <td className={cellClassName}>
        <UserStatusAction user={user} />
      </td>
    </tr>
  );
}
