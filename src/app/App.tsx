import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RouterProvider, type DataRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { bootstrapSession } from '@/features/auth/bootstrapSession';

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
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
