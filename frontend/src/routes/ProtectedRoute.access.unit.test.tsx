import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as useAuthModule from '@/context/auth/useAuth';

import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/context/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/core/LoadingScreen', () => ({
  LoadingScreen: () => <div data-testid="loading">Loading</div>,
}));

const mockUseAuth = useAuthModule.useAuth as ReturnType<typeof vi.fn>;

function renderRoute() {
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Private Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute — auth states', () => {
  beforeEach(() => {
    // No OAuth callback params, so the redirect guard does not short-circuit.
    vi.stubGlobal('location', { search: '' });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the loading screen and does not sign in while auth is loading', () => {
    const signIn = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      isSigningOut: false,
      signIn,
    });

    renderRoute();

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText('Private Content')).not.toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows the loading screen and does not sign in while signing out', () => {
    const signIn = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      isSigningOut: true,
      signIn,
    });

    renderRoute();

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText('Private Content')).not.toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('triggers signIn once when unauthenticated and keeps showing the loading screen', () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      isSigningOut: false,
      signIn,
    });

    const { rerender } = renderRoute();

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText('Private Content')).not.toBeInTheDocument();

    // The loginAttempted ref must prevent a second redirect on re-render.
    rerender(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Private Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('renders children when authenticated with a CSP capability', () => {
    const signIn = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { privileges: ['VIEW'] },
      isAuthenticated: true,
      isLoading: false,
      isSigningOut: false,
      signIn,
    });

    renderRoute();

    expect(screen.getByText('Private Content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });
  it('denies an authenticated account without a CSP grant', () => {
    mockUseAuth.mockReturnValue({
      user: { privileges: [] },
      isAuthenticated: true,
      isLoading: false,
      isSigningOut: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    renderRoute();
    expect(screen.getByRole('heading', { name: 'No CSP access' })).toBeInTheDocument();
    expect(screen.queryByText('Private Content')).not.toBeInTheDocument();
  });
});
