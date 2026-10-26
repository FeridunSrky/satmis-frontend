import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { ButtonLink } from '@/shared/components/Button';
import { PlateMark } from '@/shared/components/PlateMark';
import { appName } from '@/shared/config/env';
import { MobileNav } from './MobileNav';
import { navLinkClassName } from './navLinkClassName';
import { UserMenu } from './UserMenu';

const plateText = appName.split('.')[0] ?? appName;

export function Header() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" aria-label={`${appName} ana sayfa`} className="shrink-0 rounded-md">
          <PlateMark text={plateText} />
        </Link>
        <nav aria-label="Ana menü" className="hidden md:block">
          <NavLink to="/ilanlar" className={navLinkClassName}>
            Satılık Araçlar
          </NavLink>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {status === 'authenticated' && user && <UserMenu user={user} />}
          {status === 'anonymous' && (
            <>
              <ButtonLink to="/giris" variant="ghost">
                Giriş yap
              </ButtonLink>
              <ButtonLink to="/kayit">Kayıt ol</ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto grid size-10 place-items-center rounded-md hover:bg-ink/5 md:hidden"
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileNavOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setIsMobileNavOpen((open) => !open)}
        >
          <span aria-hidden="true" className="flex w-5 flex-col gap-1">
            <span className="h-0.5 rounded bg-ink" />
            <span className="h-0.5 rounded bg-ink" />
            <span className="h-0.5 rounded bg-ink" />
          </span>
        </button>
      </div>
      {isMobileNavOpen && (
        <MobileNav id="mobile-nav" onNavigate={() => setIsMobileNavOpen(false)} />
      )}
    </header>
  );
}
