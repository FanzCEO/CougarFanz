/**
 * FanzSSO Authentication Context
 * Provides auth state and methods to all components
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ssoClient, User, AuthResponse } from '../lib/sso-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSSO: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fanz_access_token';
const REFRESH_TOKEN_KEY = 'fanz_refresh_token';
const USER_KEY = 'fanz_user';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from storage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          // Validate the stored token
          const validation = await ssoClient.validateToken(storedToken);

          if (validation.valid && validation.user) {
            setToken(storedToken);
            setUser(validation.user);
          } else {
            // Token invalid, try refresh
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              try {
                const refreshed = await ssoClient.refreshToken(refreshToken);
                const newValidation = await ssoClient.validateToken(refreshed.token);

                if (newValidation.valid && newValidation.user) {
                  setToken(refreshed.token);
                  setUser(newValidation.user);
                  localStorage.setItem(TOKEN_KEY, refreshed.token);
                } else {
                  clearAuth();
                }
              } catch {
                clearAuth();
              }
            } else {
              clearAuth();
            }
          }
        }
      } catch (error) {
        console.error('Auth load error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!token) return;

    // Refresh token every 45 minutes (token expires in 1 hour)
    const refreshInterval = setInterval(async () => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const refreshed = await ssoClient.refreshToken(refreshToken);
          setToken(refreshed.token);
          localStorage.setItem(TOKEN_KEY, refreshed.token);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuth();
      }
    }, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [token]);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const saveAuth = (authResponse: AuthResponse) => {
    setToken(authResponse.token);
    setUser(authResponse.user);
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await ssoClient.login(email, password);
      saveAuth(response);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithSSO = useCallback(async () => {
    const authUrl = await ssoClient.getAuthorizationUrl();
    window.location.href = authUrl;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await ssoClient.logout(token);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearAuth();
  }, [token]);

  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshed = await ssoClient.refreshToken(refreshToken);
    const validation = await ssoClient.validateToken(refreshed.token);

    if (validation.valid && validation.user) {
      setToken(refreshed.token);
      setUser(validation.user);
      localStorage.setItem(TOKEN_KEY, refreshed.token);
    } else {
      throw new Error('Token refresh validation failed');
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    loginWithSSO,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
}
