import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useAuthMutations';
import { Button, ButtonLink } from '@/shared/components/Button';
import { HeaderSearch } from './HeaderSearch';
import { navLinkClassName } from './navLinkClassName';
import { USER_MENU_LINKS } from './userMenuLinks';

interface MobileNavProps {
  id: string;
  onNavigate: () => void;
}

export function MobileNav({ id, onNavigate }: MobileNavProps) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onNavigate();
    // Leave protected pages first; otherwise ProtectedRoute would bounce to the login page
    await navigate('/');
    await logout();
  };

  return (
    <nav
      id={id}
      aria-label="Mobil menü"
      className="border-t border-line bg-paper px-4 pt-3 pb-5 md:hidden"
    >
      <HeaderSearch className="mb-3" onSearch={onNavigate} />
      <div className="flex flex-col gap-1">
        <NavLink to="/ilanlar" className={navLinkClassName} onClick={onNavigate}>
          İlanlar
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={navLinkClassName} onClick={onNavigate}>
            Yönetim
          </NavLink>
        )}
        {status === 'authenticated' &&
          USER_MENU_LINKS.map((menuLink) => (
            <NavLink
              key={menuLink.to}
              to={menuLink.to}
              className={navLinkClassName}
              onClick={onNavigate}
            >
              {menuLink.label}
            </NavLink>
          ))}
      </div>
      {status === 'authenticated' && (
        <ButtonLink to="/ilan-ver" fullWidth className="mt-3" onClick={onNavigate}>
          İlan ver
        </ButtonLink>
      )}
      {status === 'authenticated' && user && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="truncate text-sm text-muted">{user.email}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Çıkış yap
          </Button>
        </div>
      )}
      {status === 'anonymous' && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
          <ButtonLink to="/giris" variant="secondary" onClick={onNavigate}>
            Giriş yap
          </ButtonLink>
          <ButtonLink to="/kayit" onClick={onNavigate}>
            Kayıt ol
          </ButtonLink>
        </div>
      )}
    </nav>
  );
}
