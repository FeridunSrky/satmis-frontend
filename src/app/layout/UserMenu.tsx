import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout } from '@/features/auth/hooks/useAuthMutations';
import type { UserResponse } from '@/shared/api/types';
import { getInitials } from '@/shared/lib/getInitials';

interface UserMenuProps {
  user: UserResponse;
}

const menuItemClassName =
  'block w-full rounded px-3 py-2 text-left text-sm font-medium text-ink hover:bg-surface';

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const logout = useLogout();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    // Leave protected pages first; otherwise ProtectedRoute would bounce to the login page
    await navigate('/');
    await logout();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-md py-1 pr-2 pl-1 hover:bg-ink/5"
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-md bg-asphalt font-display text-sm font-semibold text-white"
        >
          {getInitials(user)}
        </span>
        <span className="max-w-40 truncate text-sm font-semibold">
          {user.firstName} {user.lastName}
        </span>
      </button>
      {isOpen && (
        <div
          id={menuId}
          className="absolute right-0 mt-2 w-52 rounded-lg border border-line bg-paper p-1.5 shadow-lg"
        >
          <Link to="/profil" className={menuItemClassName} onClick={() => setIsOpen(false)}>
            Profilim
          </Link>
          <button type="button" className={menuItemClassName} onClick={handleLogout}>
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
