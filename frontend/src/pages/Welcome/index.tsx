import { Login } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { useEffect } from 'react';
import { Navigate } from 'react-router';

import bcGovLogo from '@/assets/img/bc-gov-logo.png';
import forestPhoto from '@/assets/img/welcome-forest.webp';
import { LoadingScreen } from '@/components/core/LoadingScreen';
import { NotificationToast } from '@/components/Layout/NotificationToast';
import { takeSignOutReason } from '@/context/auth/signOutReason';
import { useAuth } from '@/context/auth/useAuth';
import { useOauthCallbackPending } from '@/context/auth/useOauthCallbackPending';
import { useNotification } from '@/context/notification/useNotification';
import { ROUTES } from '@/routes/routePaths';

import './index.scss';

export function WelcomePage() {
  const { isAuthenticated, isLoading, signIn, loginError } = useAuth();
  const { addNotification } = useNotification();
  const isCallbackPending = useOauthCallbackPending();

  // An expired session lands here exactly as a deliberate sign-out does: the
  // federated logout chain's return URL is fixed, so the reason stashed before
  // the chain ran is the only thing that tells them apart (see signOutReason).
  //
  // Waits for the session check to settle before reading anything. Someone who
  // turns out to be signed in is about to be redirected into the app by the
  // branch below, and a persistent notice queued on the way past would render
  // in the shell's toast stack and never auto-close — an "expired" toast stuck
  // over a live session. That is reachable: the Cognito-only fallback sign-out
  // clears local tokens without ending the upstream session, so ProtectedRoute
  // re-authenticates silently and returns to this page — authenticated, with
  // the flag still set. Gating on `isAuthenticated` alone would not be enough,
  // since it is still false here while `isLoading` is true.
  //
  // The reason is consumed either way, so it cannot go stale and surface on
  // some later visit. A re-run reads 'user' and adds nothing, which is also
  // what makes StrictMode's second pass a no-op.
  useEffect(() => {
    if (isLoading || isCallbackPending) return;

    const reason = takeSignOutReason();
    if (isAuthenticated || reason !== 'timeout') return;

    addNotification({
      kind: 'info',
      title: 'Your session has expired',
      subtitle: 'Please log in again to continue.',
      // The sign-out fired *because* the user was idle, so this page finishes
      // loading while they are away. An auto-closing notice would expire
      // unseen, and the flag is already consumed, so a reload could not bring
      // it back — it waits for them instead.
      persistent: true,
    });
  }, [isLoading, isCallbackPending, isAuthenticated, addNotification]);

  // A live session settles it, whatever is on the URL: stale callback params
  // survive a reload, a back-button and a second tab, and waiting on an
  // exchange that has already happened would only stall someone who is
  // signed in.
  if (isAuthenticated) return <Navigate to={ROUTES.SEARCH} replace />;
  if (isLoading || isCallbackPending) return <LoadingScreen />;

  const startLogin = (provider: 'idir' | 'business-bceid') =>
    void signIn(provider).catch(() =>
      addNotification({
        kind: 'error',
        title: 'Could not start sign-in',
        subtitle: 'Please try again.',
      }),
    );

  return (
    <main id="main-content" className="welcome-page">
      <div className="welcome-page__panel">
        <img className="welcome-page__logo" src={bcGovLogo} alt="Government of British Columbia" />
        <h1 className="welcome-page__heading">Welcome to CSP</h1>
        <p className="welcome-page__subheading">Coast Selling Price System</p>
        {loginError && <p role="alert">{loginError}</p>}
        <div className="welcome-page__actions">
          <Button
            kind="primary"
            size="lg"
            renderIcon={Login}
            className="welcome-page__action"
            onClick={() => startLogin('idir')}
          >
            Log in with IDIR
          </Button>
          <Button
            kind="tertiary"
            size="lg"
            renderIcon={Login}
            className="welcome-page__action"
            onClick={() => startLogin('business-bceid')}
          >
            Log in with Business BCeID
          </Button>
        </div>
      </div>
      <div className="welcome-page__photo">
        <img src={forestPhoto} alt="" fetchPriority="high" />
      </div>
      <NotificationToast />
    </main>
  );
}
