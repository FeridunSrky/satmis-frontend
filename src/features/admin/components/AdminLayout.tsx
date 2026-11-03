import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { useModerationCounts } from '../hooks/useAdminComments';
import type { ModerationCounts } from '../types';

interface AdminSection {
  to: string;
  label: string;
  /** The count shown as a badge on this tab, if it has pending work. */
  countKey?: keyof ModerationCounts;
}

const ADMIN_SECTIONS: readonly AdminSection[] = [
  { to: '/admin/ilanlar', label: 'İlan onayı', countKey: 'pendingListings' },
  { to: '/admin/yorumlar', label: 'Yorumlar', countKey: 'pendingComments' },
  { to: '/admin/sikayetler', label: 'Şikayetler', countKey: 'reportedListings' },
  { to: '/admin/kullanicilar', label: 'Kullanıcılar' },
  { to: '/admin/katalog', label: 'Katalog' },
];

function sectionLinkClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'inline-flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-semibold whitespace-nowrap transition-colors',
    isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-muted hover:text-ink',
  );
}

export function AdminLayout() {
  // Badges are extras: while the counts load or fail the tabs simply show none
  const countsQuery = useModerationCounts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Yönetim</h1>
      <nav aria-label="Yönetim bölümleri" className="mt-6 border-b border-line">
        <ul className="flex gap-6 overflow-x-auto">
          {ADMIN_SECTIONS.map((section) => {
            const count = section.countKey ? (countsQuery.data?.[section.countKey] ?? 0) : 0;
            return (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={sectionLinkClassName}
                  aria-label={count > 0 ? `${section.label}, ${count} bekleyen` : undefined}
                >
                  {section.label}
                  {count > 0 && (
                    <span
                      aria-hidden="true"
                      className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white"
                    >
                      {count}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
