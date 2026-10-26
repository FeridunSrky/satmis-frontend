import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useEffect, type CSSProperties } from 'react';
import { RouterProvider, type DataRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { bootstrapSession } from '@/features/auth/bootstrapSession';

const TOAST_DURATION_MS = 4000;
// Drives the countdown bar in index.css so it always matches the real auto-close time
const toasterStyle = { '--toast-duration': `${TOAST_DURATION_MS}ms` } as CSSProperties;

interface AppProps {
  router: DataRouter;
  queryClient: QueryClient;
}

export function App({ router, queryClient }: AppProps) {
  useEffect(() => {
    // Safe under StrictMode's double effect run: bootstrapSession is memoised
    void bootstrapSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={TOAST_DURATION_MS}
        style={toasterStyle}
      />
    </QueryClientProvider>
  );
}
