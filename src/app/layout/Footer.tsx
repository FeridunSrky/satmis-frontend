import { Link } from 'react-router-dom';
import { appName } from '@/shared/config/env';

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto bg-asphalt text-white/70">
      <span aria-hidden="true" className="lane-dashes block h-1 opacity-70" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {CURRENT_YEAR} {appName}
        </p>
        <nav aria-label="Alt menü" className="flex gap-5">
          <Link to="/ilanlar" className="hover:text-white">
            Satılık Araçlar
          </Link>
          <Link to="/kayit" className="hover:text-white">
            Hesap oluştur
          </Link>
        </nav>
      </div>
    </footer>
  );
}
