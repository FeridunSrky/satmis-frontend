import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { createQueryClient } from './app/queryClient';
import { routes } from './app/routes';
import { installAuth } from './features/auth/installAuth';
import { appName } from './shared/config/env';
import './index.css';

document.title = appName;

const queryClient = createQueryClient();
const router = createBrowserRouter(routes);

installAuth({
  queryClient,
  navigate: (path) => void router.navigate(path, { replace: true }),
  getCurrentPath: () => router.state.location.pathname + router.state.location.search,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>,
);
