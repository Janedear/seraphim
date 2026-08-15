import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { queryClientInstance } from '@/lib/query-client';
import NavigationTracker from '@/lib/NavigationTracker';
import { pagesConfig } from './pages.config';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = Pages[mainPageKey] ?? (() => null);

function LayoutWrapper({ children, currentPageName }) {
  if (!Layout) return children;
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
}

function AuthenticatedApp() {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }
  if (authError?.type === 'auth_required') {
    navigateToLogin();
    return null;
  }
  if (authError?.type === 'config_error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="max-w-md p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-slate-100">Configuration error</h2>
          <p className="mb-4 text-slate-400">{authError.message}</p>
          <p className="text-sm text-slate-500">Add your app ID and API base URL to .env.local, or set VITE_LOCAL_BACKEND=true.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BrowserRouter>
          <NavigationTracker />
          <AuthenticatedApp />
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton theme="dark" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
