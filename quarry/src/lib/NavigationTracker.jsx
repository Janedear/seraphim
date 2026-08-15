import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '@/api/client';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { Pages, mainPage } = pagesConfig;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  useEffect(() => {
    const log = api.appLogs?.logUserInApp;
    if (!isAuthenticated || typeof log !== 'function') return;

    const pathname = location.pathname;
    let pageName = mainPageKey;
    if (pathname && pathname !== '/') {
      const segment = pathname.replace(/^\//, '').split('/')[0];
      pageName = Object.keys(Pages).find((key) => key.toLowerCase() === segment.toLowerCase()) || null;
    }
    if (pageName) log(pageName).catch(() => {});
  }, [location, isAuthenticated, Pages, mainPageKey]);

  return null;
}
