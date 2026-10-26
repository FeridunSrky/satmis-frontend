import type { RouteObject } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from '@/features/auth/components/RouteGuards';
import { FullPageLoader } from '@/shared/components/FullPageLoader';
import { AppLayout } from './layout/AppLayout';

// Pages are split per route so the first load only ships what the landing page needs
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    hydrateFallbackElement: <FullPageLoader />,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/HomePage').then((module) => ({ Component: module.HomePage })),
      },
      {
        path: 'ilanlar',
        lazy: () =>
          import('@/pages/ListingsPage').then((module) => ({ Component: module.ListingsPage })),
      },
      {
        element: <GuestRoute />,
        children: [
          {
            path: 'giris',
            lazy: () =>
              import('@/pages/LoginPage').then((module) => ({ Component: module.LoginPage })),
          },
          {
            path: 'kayit',
            lazy: () =>
              import('@/pages/RegisterPage').then((module) => ({ Component: module.RegisterPage })),
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'profil',
            lazy: () =>
              import('@/pages/ProfilePage').then((module) => ({ Component: module.ProfilePage })),
          },
        ],
      },
      {
        path: '*',
        lazy: () =>
          import('@/pages/NotFoundPage').then((module) => ({ Component: module.NotFoundPage })),
      },
    ],
  },
];
