import { type Page } from '@playwright/test';

/**
 * Cross-domain browser-interaction helpers — mock identity, client-side navigation, and Carbon
 * date entry. These hold no domain vocabulary, so every page object across every domain reuses them
 * from here rather than re-inlining or keeping a domain-local copy "private".
 */

// ---------------------------------------------------------------------------
// CSP mock auth — GROUNDED for this app (differs from the scaffold default).
//
// The scaffold assumes an NR Landing page with an IDIR button to click and an
// IN-MEMORY session that a full page.goto() would drop. CSP does NOT work that
// way: frontend/src/context/auth/MockAuthProvider.tsx returns
// `isAuthenticated: true` immediately, with the role read from
// localStorage['csp.mockRole'] (default 'ADMIN'). See also frontend/src/env.ts —
// mock auth requires BOTH `mockUser: true` in public/config.js AND a localhost
// hostname. The file is tracked with public mock defaults; never put credentials
// in it or commit machine-specific overrides.
//
// Consequences, and why there is no login dance below:
//   * there is nothing to click — the app is authenticated on first paint;
//   * the session is NOT in-memory-only, so page.goto() to a protected route is
//     safe and clientSideNavigate() is optional (kept for parity/other apps).
// ---------------------------------------------------------------------------

/** localStorage key MockAuthProvider reads the role from (MOCK_ROLE_KEY in MockAuthProvider.tsx). */
const MOCK_ROLE_KEY = 'csp.mockRole';

/**
 * Roles CSP's mock provider accepts. These are the EXACT members of `ROLES` in
 * frontend/src/context/auth/permissions.ts — `['ADMIN', 'APPROVE', 'VIEW']`. The provider maps `X`
 * to the CSS group `CSP_X`.
 *
 * Getting this wrong is silent: `MockAuthProvider.getStoredRole()` falls back to 'ADMIN' for any
 * value not in that list, so a scenario asking for a role that does not exist runs with FULL ADMIN
 * rights and its permission assertions pass while proving nothing. `assertMockRole` below turns
 * that into a loud failure instead.
 */
export const MOCK_ROLES = ['ADMIN', 'APPROVE', 'VIEW'] as const;
export type MockRole = (typeof MOCK_ROLES)[number];

/** Fail loudly on a role the app does not define, rather than silently getting ADMIN. */
export function assertMockRole(role: string): MockRole {
  const upper = role.toUpperCase();
  if (!(MOCK_ROLES as readonly string[]).includes(upper)) {
    throw new Error(
      `Unknown CSP role "${role}". MockAuthProvider only accepts ${MOCK_ROLES.join(', ')} ` +
        `(frontend/src/context/auth/permissions.ts) and silently falls back to ADMIN for anything ` +
        `else — which would make a permission assertion pass for the wrong reason.`,
    );
  }
  return upper as MockRole;
}

/** The role MockAuthProvider falls back to when localStorage holds nothing valid. */
export const MOCK_USER_ROLE: MockRole = 'ADMIN';

/**
 * Establish the mock identity for the scenario.
 *
 * Seeds localStorage BEFORE any app code runs (addInitScript applies to every document in the
 * context), so the very first render is already authenticated as `role` — no login step, and no
 * race against a redirect to the welcome screen. Call this before the first navigation.
 */
export async function signInAsMockUser(page: Page, role: MockRole = MOCK_USER_ROLE): Promise<void> {
  // Enable mock auth for THIS BROWSER ONLY, by rewriting the runtime config as it is served.
  //
  // src/env.ts gates mock auth on `window.appConfig.mockUser === true`, which comes from
  // public/config.js -- a file the dev server serves to EVERY frontend on this machine.
  // Editing it on disk would be invisible, sticky, and shared: it silently switches the developer's
  // own stack to mock auth too, and if that stack's backend still has AUTH_MOCK_ENABLED=false it
  // then 401s every single API call while looking logged in. (Observed for real.)
  //
  // Intercepting the request instead keeps the opt-in inside the test browser: the file on disk is
  // never touched, so a developer's manual CSS login keeps working while the suite runs.
  await page.route('**/config.js', async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: /["']?mockUser["']?\s*:/.test(original)
        ? original.replace(/(["']?mockUser["']?\s*:\s*)(?:true|false)/g, '$1true')
        : original.replace(/window\.appConfig\s*=\s*\{/, 'window.appConfig = { mockUser: true,'),
    });
  });

  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Private mode / blocked storage: MockAuthProvider then falls back to ADMIN, which is the
        // default this helper asks for anyway. Never fail the scenario on a storage write.
      }
    },
    [MOCK_ROLE_KEY, role] as const,
  );
}

/**
 * Kept for cross-app parity: apps whose mock session is in-memory only must navigate client-side so
 * a reload doesn't drop it. CSP does not need this (see the note above), but a step that wants to
 * assert SPA routing rather than a fresh document load can still use it.
 */
/**
 * Client-side navigate to a protected route so the in-memory mock session survives — a full
 * `page.goto()` would reload the app and drop it. React Router reads
 * `location.state` from `history.state.usr`, so a non-empty `state` is seeded there. The
 * screen-specific readiness assertion (which heading/control proves the screen loaded) stays in the
 * calling page object. This is the ONE home for the mock-auth nav dance — every page object across
 * every domain reuses it rather than re-inlining `history.pushState`/`PopStateEvent`.
 */
export async function clientSideNavigate(page: Page, path: string, state: Record<string, unknown> = {}): Promise<void> {
  await page.evaluate(
    ({ p, usr }) => {
      const hasState = Object.keys(usr).length > 0;
      window.history.pushState(hasState ? { usr } : {}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    { p: path, usr: state },
  );
}

/**
 * Commit a value into a Carbon DatePicker input: click, type, then Escape (dismiss the calendar
 * overlay) and blur (onBlur reads the typed value). Shared across every domain's date fields.
 */
export async function setDateField(page: Page, id: string, value: string): Promise<void> {
  const input = page.locator(id);
  await input.click();
  await input.fill(value);
  await page.keyboard.press('Escape');
  await input.blur();
}
