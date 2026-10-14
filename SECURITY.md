# Security Policy

## Supported Versions

Only the current `main` branch — what runs in the **test** and **prod** OpenShift environments
— receives security fixes. Older images and PR environments are not supported. PR environments
are removed when the PR closes, or purged after a week by `scheduled.yml`.

## Reporting a Vulnerability

**DO NOT open public GitHub issues for security vulnerabilities.**

Report privately through GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Under **Advisories** in the sidebar, click **Report a vulnerability**.
3. Fill in the advisory form. Only the repository maintainers can see it.

Please include the affected URL or component, steps to reproduce, and the impact you expect.
While investigating, do not access, modify, or delete data that isn't yours.

## Security Controls

A summary for maintainers of the automated checks and the design decisions that carry security
weight. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design.

### Automated scanning

| Control | Where | When |
|---|---|---|
| Trivy — vulnerabilities, secrets, and IaC misconfiguration (`CRITICAL,HIGH`, fixable only) | `analysis.yml`; results upload to the GitHub Security tab as SARIF | Every PR, every push to `main`, and weekly on Sundays |
| SonarCloud, backend and frontend | `analysis.yml` | Every PR and push to `main` |
| Frontend dependency and supply-chain scan | `bcgov/action-test-and-analyse` | Every PR touching `frontend/` |
| OWASP ZAP full scan against **test** | `scheduled.yml` | Weekly, Saturdays (`0 11 * * 6`) |
| gitleaks secret scanning | `.pre-commit-config.yaml` | On commit, once `pre-commit install` has been run |
| Dependency updates | Renovate (`renovate.json`, bcgov shared presets) | Continuous |

Accepted Trivy exceptions live in `.github/.trivyignore`. Add a justification comment whenever
you add one.

### Authentication and authorization

- Browser login uses BC Gov SSO (CSS Keycloak) with FAM-managed roles. `oidc-client-ts` uses
  authorization code with PKCE and a public client, stores OIDC state in tab-scoped
  `sessionStorage`, and sends the **access token** as a bearer token on `/api` calls.
- The backend requires `CSP_OIDC_ISSUER_URI` and `CSP_OIDC_CLIENT_ID` when real authentication
  is enabled. It validates the RS256 signature against the realm's JWKS (key selected by `kid`),
  exact issuer and `azp`, `typ=Bearer`, expiry, supported identity provider, and audit username.
- Roles come from `client_roles`, falling back to `resource_access.<configured client>.roles`.
  Only exact `CSP_VIEW`, `CSP_APPROVE`, and `CSP_ADMIN` codes, matched case-insensitively, grant
  the internal `VIEW`, `APPROVE`, and `ADMIN` authorities to IDIR/IDIR MFA identities. Bare roles,
  suffix aliases, foreign-app roles, and `FAM:` bookkeeping roles grant no access. Business BCeID
  can authenticate but receives no staff capability; industry role/client scope remains separate.
- All `/api/**` endpoints require one of those staff authorities, except the public `/api/health`
  and Swagger/OpenAPI paths. Write endpoints also use `@PreAuthorize` through `PermissionService`
  for action-level checks. The frontend's No CSP access screen is a UX gate; API checks enforce
  authorization.
- Sessions are stateless: no cookie, no server-side session. CSRF protection is disabled
  deliberately, which is correct for bearer-token auth with no browser-automatable credential.
- Signing out clears local OIDC credentials and redirects through SiteMinder and the configured
  CSS realm back to `/`, using `id_token_hint` when available. There is no legacy broker popup.
- Idle sessions sign out after `idleTimeoutMinutes` (default 30), independently of token expiry.
  Requests and user activity share token renewal. Expired/revoked refresh tokens end the session;
  temporary SSO/network failures preserve the credentials for recovery.

### Mock authentication — local development only

Mock auth bypasses CSS authentication and authenticates every request as `local-dev-user` with
the roles in `AUTH_MOCK_ROLES`. Four independent things keep it out of deployed environments:

1. `MockRequestFilter` is annotated `@ConditionalOnProperty(name = "auth.mock.enabled",
   havingValue = "true")`, so the filter bean does not exist unless explicitly enabled.
2. The backend `prod` profile sets `auth.mock.enabled: false`.
3. OpenShift deploys `AUTH_MOCK_ENABLED=false`, and the generated `config.js` sets
   `mockUser: false`.
4. The frontend honours `mockUser` only when served from a local hostname (`localhost`,
   `127.0.0.1`, `0.0.0.0`, `::1`, or `*.localhost`), re-checked at runtime in `env.ts`.

> **The environment variable overrides the profile.** `AUTH_MOCK_ENABLED=true` will enable mock
> auth even under the `prod` profile, because environment variables outrank profile YAML in
> Spring Boot. Never set it to `true` in a deployed environment.

### Transport and network

- Oracle is reached over **TCPS**. An init container fetches the Oracle wallet into a shared
  volume and the entrypoint merges it into the JVM trust store at startup.
- The backend has **no Route**. All `/api/*` traffic goes through the frontend's Caddy reverse
  proxy, on the same origin as the SPA — which is also why no CORS configuration exists.
- NetworkPolicies (`common/openshift.init.yml`) permit backend ingress only from frontend pods
  **in the same zone** and from the cluster monitoring namespace; frontend ingress only from the
  OpenShift router.
- TLS terminates at the OpenShift edge router, so the backend only ever sees plain HTTP and its
  Spring HSTS configuration never fires. HSTS is set at the Caddy layer instead.

### Container hardening

- Containers run as non-root with `readOnlyRootFilesystem: true`, all capabilities dropped
  (`drop: ["ALL"]`), and `automountServiceAccountToken: false`.
- The frontend image strips `CAP_NET_BIND_SERVICE` from the Caddy binary — OpenShift's
  restricted SCC refuses to exec a binary carrying file capabilities when
  `allowPrivilegeEscalation=false`, and the app listens on 3000 so the capability is unneeded.

### Browser hardening

Caddy sets the security headers for both static responses and proxied `/api/*` responses
(`frontend/Caddyfile`):

- `Content-Security-Policy` — `default-src 'self'`, with the configured CSS issuer path allowed
  for `connect-src` discovery/token/refresh requests, `frame-ancestors 'none'`, `object-src 'none'`.
- `Strict-Transport-Security` — one year, `includeSubDomains`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.

The router's HAProxy balancing cookie is disabled
(`haproxy.router.openshift.io/disable_cookies`) — the frontend is stateless and needs no
session affinity, and the cookie was otherwise flagged by scans as `SameSite=None`.

### Secrets

- Credentials live only in GitHub Actions secrets, OpenShift Secrets, or ignored local `.env`
  files, and are never committed. `.env` and `backend/certs/*` are git-ignored.
- Local corporate-proxy certificates in `backend/certs/` exist only in local builds and never
  reach CI/CD images.
- `frontend/public/config.js` is tracked with public localhost mock defaults;
  `frontend/public/config.example.js` shows real-auth configuration using public issuer/client
  metadata. Neither file may contain credentials, and machine-specific local overrides must
  not be committed. Deployed `/config.js` is generated from GitHub Environment **variables**
  `CSP_OIDC_ISSUER_URI` and `CSP_OIDC_CLIENT_ID`, not secrets. This public browser client has no
  client secret. See the [migration and rollback guide](docs/fam-keycloak-migration.md).
