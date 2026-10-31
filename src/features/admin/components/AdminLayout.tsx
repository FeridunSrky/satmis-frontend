import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';

const ADMIN_SECTIONS = [
  { to: '/admin/ilanlar', label: 'İlan onayı' },
  { to: '/admin/kullanicilar', label: 'Kullanıcılar' },
  { to: '/admin/katalog', label: 'Katalog' },
] as const;

function sectionLinkClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
    isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-muted hover:text-ink',
  );
}

export function AdminLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Yönetim</h1>
      <nav aria-label="Yönetim bölümleri" className="mt-6 border-b border-line">
        <ul className="flex gap-6 overflow-x-auto">
          {ADMIN_SECTIONS.map((section) => (
            <li key={section.to}>
              <NavLink to={section.to} className={sectionLinkClassName}>
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
