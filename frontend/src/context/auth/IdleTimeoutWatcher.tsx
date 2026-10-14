import { env } from '@/env';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { getOidcUser, isSessionEnded } from '@/service/oidc-service';

import { emitSessionExpired } from './sessionExpiredSignal';
import { useAuth } from './useAuth';

/**
 * Signs the user out after a period of inactivity, independent of the
 * underlying SSO token TTL. Disabled in mock-user dev mode, since
 * MockAuthProvider's signOut() doesn't actually deauthenticate.
 */
export function IdleTimeoutWatcher() {
  const { isAuthenticated, signOut } = useAuth();

  useIdleTimeout({
    enabled: isAuthenticated && !env.mockUser,
    timeoutMs: env.idleTimeoutMs,
    onTimeout: () => void signOut('timeout'),
    onActivity: () => {
      void getOidcUser().catch((error) => {
        if (isSessionEnded(error)) emitSessionExpired();
      });
    },
  });

  return null;
}
