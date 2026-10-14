import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/core/LoadingScreen';
import { clearPersistedTableState } from '@/hooks/usePersistentState';
import {
  AUTH_CALLBACK_PATH,
  completeOidcLogin,
  endOidcSession,
  getOidcReturnPath,
  getUserManager,
  isOidcConfigured,
  restoreOidcUser,
  startOidcLogin,
} from '@/service/oidc-service';

import { AuthContext } from './AuthContext';
import { famUserFromAccessToken } from './famUser';
import { onSessionExpired } from './sessionExpiredSignal';
import { setSignOutReason } from './signOutReason';

import type { SignOutReason } from './signOutReason';
import type { AuthContextValue, AuthUser } from './types';
import type { User } from 'oidc-client-ts';

export function RealAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [loginError, setLoginError] = useState<string>();

  const performSignOut = useCallback(async (reason: SignOutReason = 'user') => {
    setIsSigningOut(true);
    setSignOutReason(reason);
    clearPersistedTableState();
    await endOidcSession();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const callback = window.location.pathname === AUTH_CALLBACK_PATH;
        const session = callback ? await completeOidcLogin() : await restoreOidcUser();
        if (!active) return;
        setUser(session ? famUserFromAccessToken(session.access_token) : null);
        if (callback && session) {
          window.history.replaceState(window.history.state, '', getOidcReturnPath(session, '/search'));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch {
        if (active) {
          setLoginError('Sign-in could not be completed. Please try again.');
          window.history.replaceState(window.history.state, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    const refreshed = (session: User) => {
      if (active) setUser(famUserFromAccessToken(session.access_token));
    };
    const manager = isOidcConfigured ? getUserManager() : undefined;
    manager?.events.addUserLoaded(refreshed);
    void load();
    let expired = false;
    const unsubscribe = onSessionExpired(() => {
      if (!expired) {
        expired = true;
        void performSignOut('timeout');
      }
    });
    return () => {
      active = false;
      manager?.events.removeUserLoaded(refreshed);
      unsubscribe();
    };
  }, [performSignOut]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    isSigningOut,
    loginError,
    signIn: (provider = 'idir') => startOidcLogin(provider),
    signOut: performSignOut,
  };
  if (window.location.pathname === AUTH_CALLBACK_PATH && isLoading) return <LoadingScreen />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
