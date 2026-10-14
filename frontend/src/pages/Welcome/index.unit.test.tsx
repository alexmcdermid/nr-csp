import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationToast } from '@/components/Layout/NotificationToast';
import { setSignOutReason } from '@/context/auth/signOutReason';
import * as useAuthModule from '@/context/auth/useAuth';
import { NotificationProvider } from '@/context/notification/NotificationProvider';

import { WelcomePage } from './index';

vi.mock('@/context/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/components/core/LoadingScreen', () => ({
  LoadingScreen: () => <div>Loading</div>,
}));

const mockUseAuth = useAuthModule.useAuth as ReturnType<typeof vi.fn>;
const signIn = vi.fn();

/**
 * Renders at '/' with a stand-in for the app's authenticated home. The stand-in
 * carries a toast renderer because the real one does — /search lives inside
 * Layout, which renders the notification stack — so a notice queued on the way
 * past the redirect shows up here instead of vanishing into context with
 * nothing to render it.
 */
const tree = () => (
  <NotificationProvider>
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/search"
          element={
            <>
              <div>Search page</div>
              <NotificationToast />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  </NotificationProvider>
);

const arrange = () => render(tree());

describe('WelcomePage', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { search: '' });
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, signIn });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('offers both sign-in options to an anonymous visitor', () => {
    arrange();

    expect(screen.getByRole('heading', { name: 'Welcome to CSP' })).toBeInTheDocument();
    expect(screen.getByText('Coast Selling Price System')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in with idir/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in with business bceid/i })).toBeInTheDocument();
  });

  it('exposes the BC Gov logo but keeps the photo out of the accessibility tree', () => {
    const { container } = arrange();

    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByAltText('Government of British Columbia')).toBeInTheDocument();
    expect(container.querySelector('.welcome-page__photo img')).toHaveAttribute('alt', '');
  });

  it('starts the IDIR sign-in when the primary button is pressed', async () => {
    const user = userEvent.setup();
    arrange();

    await user.click(screen.getByRole('button', { name: /log in with idir/i }));

    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('reports a sign-in that fails before it leaves the page', async () => {
    const user = userEvent.setup();
    signIn.mockRejectedValueOnce(new Error('UserAlreadyAuthenticatedException'));
    arrange();

    await user.click(screen.getByRole('button', { name: /log in with idir/i }));

    expect(await screen.findByText(/could not start sign-in/i)).toBeInTheDocument();
  });

  it('starts the selected Business BCeID provider', async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValueOnce(undefined);
    arrange();

    await user.click(screen.getByRole('button', { name: /log in with business bceid/i }));

    expect(signIn).toHaveBeenCalledWith('business-bceid');
  });

  it('sends an already-authenticated visitor into the app', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, signIn });

    arrange();

    expect(screen.getByText('Search page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Welcome to CSP' })).not.toBeInTheDocument();
  });

  it('waits rather than showing the sign-in choice while the session is still loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, signIn });

    arrange();

    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Welcome to CSP' })).not.toBeInTheDocument();
  });

  // Cognito redirects back to '/', and Amplify reports isLoading: false before
  // the signedIn event lands — without the guard the welcome screen would flash
  // at someone who has just authenticated.
  it('does not flash the sign-in choice mid-OAuth-callback', () => {
    vi.stubGlobal('location', { search: '?code=abc&state=xyz' });

    arrange();

    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log in with idir/i })).not.toBeInTheDocument();
  });

  // Stale params outlive the exchange that produced them — a reload, a back
  // button, a second tab — and re-exchanging a consumed code fails, so nothing
  // clears them. Waiting on that would stall someone who is already signed in.
  it('sends an authenticated visitor on without waiting out stale callback params', () => {
    vi.stubGlobal('location', { search: '?code=abc&state=xyz', pathname: '/' });
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, signIn });

    arrange();

    expect(screen.getByText('Search page')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  // Only Amplify's success path clears the params, so without a bounded wait a
  // failed exchange would leave the loading screen up for good — and still up
  // after a reload.
  it('falls back to the sign-in choice when the callback never completes', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('location', { search: '?code=abc&state=xyz', pathname: '/' });
    const replaceState = vi.fn();
    vi.stubGlobal('history', { replaceState });

    try {
      arrange();
      expect(screen.getByText('Loading')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(15_000);
      });

      expect(screen.getByRole('button', { name: /log in with idir/i })).toBeInTheDocument();
      expect(replaceState).toHaveBeenCalledWith(null, '', '/');
    } finally {
      vi.useRealTimers();
    }
  });

  // A timed-out session and a deliberate sign-out land here identically — the
  // logout chain's return URL is fixed — so the reason stashed before the chain
  // ran is the only thing that can explain why the user is back on the welcome
  // screen instead of the page they were working on.
  describe('an expired session', () => {
    it('says the session expired when the sign-out was a timeout', async () => {
      setSignOutReason('timeout');

      arrange();

      expect(await screen.findByText(/your session has expired/i)).toBeInTheDocument();
      expect(screen.getByText(/please log in again to continue/i)).toBeInTheDocument();
    });

    it('says nothing after a deliberate sign-out', async () => {
      arrange();

      await screen.findByRole('heading', { name: 'Welcome to CSP' });
      expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument();
    });

    // takeSignOutReason() clears the flag on read, so a reload or a second
    // visit must not repeat a stale expiry notice.
    it('does not repeat the notice on a later visit', async () => {
      setSignOutReason('timeout');

      const first = arrange();
      expect(await screen.findByText(/your session has expired/i)).toBeInTheDocument();
      first.unmount();

      arrange();

      await screen.findByRole('heading', { name: 'Welcome to CSP' });
      expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument();
    });

    // The reason is consumed on mount, before the session check has settled, so
    // the notice has to survive the loading screen rather than be lost behind it.
    it('still shows the notice when the session check is slower than the mount', async () => {
      setSignOutReason('timeout');
      mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, signIn });

      const { rerender } = arrange();
      expect(screen.getByText('Loading')).toBeInTheDocument();

      mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, signIn });
      rerender(tree());

      expect(await screen.findByText(/your session has expired/i)).toBeInTheDocument();
    });

    // Reachable via the Cognito-only fallback sign-out: it clears local tokens
    // without ending the upstream session, so ProtectedRoute re-authenticates
    // silently and returns here — signed in, with the flag still set. A
    // persistent notice queued on the way past would render in the shell's
    // toast stack and never auto-close, stranding an "expired" toast over a
    // live session.
    it('queues nothing for a visitor who turns out to be signed in', () => {
      setSignOutReason('timeout');
      mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, signIn });

      arrange();

      expect(screen.getByText('Search page')).toBeInTheDocument();
      expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument();
    });

    // isAuthenticated is still false while the session check is in flight, so
    // reading the reason before it settles would queue the notice anyway and
    // only then discover the live session.
    it('waits for the session check before reading the reason', async () => {
      setSignOutReason('timeout');
      mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, signIn });

      const { rerender } = arrange();
      expect(screen.getByText('Loading')).toBeInTheDocument();

      // Settles as signed in — the notice must never have been queued.
      mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, signIn });
      rerender(tree());

      expect(await screen.findByText('Search page')).toBeInTheDocument();
      expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument();
    });

    // The sign-out fired *because* the user was idle, so the page loads while
    // they are away. An auto-closing notice would expire unseen, and the flag
    // is already consumed, so a reload could not bring it back.
    it('keeps the notice up instead of auto-closing it', async () => {
      vi.useFakeTimers();
      setSignOutReason('timeout');

      try {
        const { container } = arrange();
        await vi.waitFor(() => expect(screen.getByText(/your session has expired/i)).toBeInTheDocument());
        // The top-right stack, same as every other notice on this page.
        expect(container.querySelector('.notification-toast-container')).toBeInTheDocument();

        // Well past the 6s a non-persistent toast closes on.
        await act(async () => {
          vi.advanceTimersByTime(60_000);
        });

        expect(screen.getByText(/your session has expired/i)).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
