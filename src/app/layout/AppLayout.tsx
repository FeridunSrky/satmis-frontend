import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-paper px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        İçeriğe geç
      </a>
      <Header />
      <main id="main-content" className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
