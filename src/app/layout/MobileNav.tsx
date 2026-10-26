import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useAuthMutations';
import { Button, ButtonLink } from '@/shared/components/Button';
import { navLinkClassName } from './navLinkClassName';

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
      <div className="flex flex-col gap-1">
        <NavLink to="/ilanlar" className={navLinkClassName} onClick={onNavigate}>
          Satılık Araçlar
        </NavLink>
        {status === 'authenticated' && (
          <NavLink to="/profil" className={navLinkClassName} onClick={onNavigate}>
            Profilim
          </NavLink>
        )}
      </div>
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
