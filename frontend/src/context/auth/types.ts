import type { Role } from './permissions';
import type { SignOutReason } from './signOutReason';

export interface AuthUser {
  username: string;
  /**
   * IDIR username from the `idir_username / bceid_username` id-token claim (e.g. "JSMITH").
   * This is the value the backend resolves as the principal and writes to audit
   * fields like `entryUserID`, so prefer it over {@link username} (a Cognito id)
   * anywhere the UI shows who entered or submitted a record.
   */
  idirUsername?: string;
  displayName?: string;
  email: string;
  /** FAM client role names from the access token (e.g. "CSP_SUBMITTER"). */
  roles: string[];
  /**
   * Derived app-level permissions extracted from {@link roles}.
   * Values are uppercase role constants: "ADMIN" | "APPROVE" | "VIEW".
   */
  privileges: Role[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  loginError?: string;
  signIn: (provider?: LoginProvider) => Promise<void>;
  /** A `'timeout'` reason makes the welcome screen say the session expired; defaults to a deliberate sign-out. */
  signOut: (reason?: SignOutReason) => Promise<void>;
}

export type LoginProvider = 'idir' | 'business-bceid';
