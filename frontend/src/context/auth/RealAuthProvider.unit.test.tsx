import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RealAuthProvider } from './RealAuthProvider';
import { useAuth } from './useAuth';
const mocks = vi.hoisted(() => ({
  restore: vi.fn(),
  callback: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  addLoaded: vi.fn(),
  removeLoaded: vi.fn(),
}));
vi.mock('@/env', () => ({
  env: { VITE_OIDC_ISSUER_URI: 'https://sso.test/realms/standard', VITE_OIDC_CLIENT_ID: 'csp-browser' },
}));
vi.mock('@/service/oidc-service', () => ({
  AUTH_CALLBACK_PATH: '/authCallback',
  isOidcConfigured: true,
  restoreOidcUser: mocks.restore,
  completeOidcLogin: mocks.callback,
  startOidcLogin: mocks.signIn,
  endOidcSession: mocks.signOut,
  getOidcReturnPath: () => '/search',
  getUserManager: () => ({ events: { addUserLoaded: mocks.addLoaded, removeUserLoaded: mocks.removeLoaded } }),
}));
function access(claims: Record<string, unknown> = {}) {
  return (
    'header.' +
    btoa(
      JSON.stringify({
        iss: 'https://sso.test/realms/standard',
        azp: 'csp-browser',
        typ: 'Bearer',
        identity_provider: 'azureidir',
        idir_username: 'JSMITH',
        client_roles: ['CSP_VIEW'],
        ...claims,
      }),
    ) +
    '.signature'
  );
}
function Probe() {
  const auth = useAuth();
  return (
    <>
      <span data-testid="privileges">{auth.user?.privileges.join(',')}</span>
      <span data-testid="audit">{auth.user?.idirUsername}</span>
      <span data-testid="error">{auth.loginError}</span>
      <button onClick={() => void auth.signIn('business-bceid')}>Business BCeID</button>
      <button onClick={() => void auth.signOut()}>Sign out</button>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
  mocks.restore.mockResolvedValue({ access_token: access() });
  mocks.signOut.mockResolvedValue(undefined);
});
describe('CSS AuthProvider', () => {
  it('uses access-token roles and the actual directory audit username', async () => {
    render(
      <RealAuthProvider>
        <Probe />
      </RealAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('privileges')).toHaveTextContent('VIEW'));
    expect(screen.getByTestId('audit')).toHaveTextContent('JSMITH');
  });
  it('does not grant staff privileges to a Business BCeID account', async () => {
    mocks.restore.mockResolvedValue({
      access_token: access({
        identity_provider: 'bceidbusiness',
        bceid_username: 'BUSINESS',
        client_roles: ['CSP_ADMIN'],
      }),
    });
    render(
      <RealAuthProvider>
        <Probe />
      </RealAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('audit')).toHaveTextContent('BUSINESS'));
    expect(screen.getByTestId('privileges')).toBeEmptyDOMElement();
  });
  it('starts the selected provider and performs federated sign-out', async () => {
    render(
      <RealAuthProvider>
        <Probe />
      </RealAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('privileges')).toHaveTextContent('VIEW'));
    await userEvent.click(screen.getByRole('button', { name: 'Business BCeID' }));
    expect(mocks.signIn).toHaveBeenCalledWith('business-bceid');
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
  it('completes a callback before rendering protected content', async () => {
    window.history.replaceState(null, '', '/authCallback?code=test&state=test');
    mocks.callback.mockResolvedValue({ access_token: access() });
    render(
      <RealAuthProvider>
        <Probe />
      </RealAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('audit')).toHaveTextContent('JSMITH'));
    expect(window.location.pathname).toBe('/search');
  });
  it('clears a failed callback and offers another sign-in', async () => {
    window.history.replaceState(null, '', '/authCallback?error=access_denied&state=test');
    mocks.callback.mockRejectedValue(new Error('expired state'));
    render(
      <RealAuthProvider>
        <Probe />
      </RealAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Sign-in could not be completed'));
    expect(window.location.search).toBe('');
  });
});
