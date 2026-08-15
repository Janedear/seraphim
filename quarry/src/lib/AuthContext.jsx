import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { logger } from '@/lib/monitoring';

const AuthContext = createContext(null);

const localMode =
  import.meta.env.VITE_LOCAL_BACKEND === 'true' ||
  import.meta.env.VITE_PREVIEW_MODE === 'true';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      logger.error('User auth check failed:', error);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const checkAppState = async () => {
    if (localMode) {
      try {
        await checkUserAuth();
        setAuthError(null);
      } catch (error) {
        logger.error('Local auth failed:', error);
        setAuthError({ type: 'unknown', message: error.message || 'Failed to load local session' });
        setIsLoadingAuth(false);
      } finally {
        setIsLoadingPublicSettings(false);
      }
      return;
    }

    if (!appParams.appId) {
      setAuthError({ type: 'config_error', message: 'App ID not configured. Set VITE_APP_ID in .env.local' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const appClient = createAxiosClient({
        baseURL: '/api/apps/public',
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true,
      });
      const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
      setAppPublicSettings(publicSettings);
      if (appParams.token) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      logger.error('App state check failed:', appError);
      const reason = appError.data?.extra_data?.reason;
      if (appError.status === 403 && reason === 'auth_required') {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else if (appError.status === 403 && reason === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
      } else if (appError.status === 403 && reason) {
        setAuthError({ type: reason, message: appError.message });
      } else {
        setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
      }
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const logout = (redirectUrl = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (redirectUrl) {
      const url = typeof redirectUrl === 'string' ? redirectUrl : window.location.href;
      api.auth.logout(url);
    } else {
      api.auth.logout();
    }
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin(window.location.href);
  };

  const role = user?.role;
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoading: isLoadingAuth || isLoadingPublicSettings,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        isAdmin: role === 'admin',
        isAnalyst: role === 'analyst' || role === 'admin',
        isReadOnly: role === 'readonly',
        canEdit: role === 'admin' || role === 'analyst',
        canDelete: role === 'admin',
        canManageUsers: role === 'admin',
        canManagePolicies: role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
