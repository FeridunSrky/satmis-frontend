import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { buildLoginPath, getSafeRedirectPath } from '@/shared/lib/safeRedirect';
import { useAuthStore } from '../authStore';

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'bootstrapping') {
    return <FullPageLoader />;
  }
  if (status === 'anonymous') {
    return <Navigate to={buildLoginPath(location.pathname + location.search)} replace />;
  }
  return <Outlet />;
}

/**
 * Hides admin pages from everyone else. This is only a display decision: every /api/admin call
 * is authorised by the backend, and a 403 there leads to the same redirect.
 */
export function AdminRoute() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const location = useLocation();

  if (status === 'bootstrapping') {
    return <FullPageLoader />;
  }
  if (status === 'anonymous') {
    return <Navigate to={buildLoginPath(location.pathname + location.search)} replace />;
  }
  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Signed-in users are sent on to `?next=` (internal paths only), so login/register can just set the session. */
export function GuestRoute() {
  const status = useAuthStore((state) => state.status);
  const [searchParams] = useSearchParams();

  if (status === 'bootstrapping') {
    return <FullPageLoader />;
  }
  if (status === 'authenticated') {
    return <Navigate to={getSafeRedirectPath(searchParams.get('next'))} replace />;
  }
  return <Outlet />;
}
