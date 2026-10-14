# NRS CSP App

The **Coast Selling Price (CSP) System** for the BC Ministry of Forests. Users submit, review
and approve coastal log sale invoices, maintain the sort-code and flat-price-conversion
reference tables, and run the R06–R13 reports. It replaces the legacy CSP system (Oracle Forms
+ JasperReports Server).

Invoices reach CSP two ways: **electronically**, as ESF XML submissions pulled from an Oracle
queue and run through a schema + business-rule validation pipeline; or **manually**, keyed in
through the UI. Both land in the same inbox for review, approval, or rejection. On top of that
sit seven operational reports (R06–R13; there is no R09), each renderable as PDF, CSV, or XLS.

Spring Boot 4 (Java 21) backend · React 19 + IBM Carbon frontend · Oracle · deployed to
OpenShift. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full stack and system design.

**Frontend**
***
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=alert_status&style=flat)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=security_rating)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=coverage)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=bugs)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=vulnerabilities)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=code_smells)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=sqale_index)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_frontend&metric=ncloc)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_frontend)

**Backend**
***
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=alert_status)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=security_rating)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=coverage)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=bugs)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=vulnerabilities)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=code_smells)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=sqale_index)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=bcgov-sonarcloud_nr-csp_backend&metric=ncloc)](https://sonarcloud.io/summary/overall?id=bcgov-sonarcloud_nr-csp_backend)


## Contents

- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Running locally with Docker Compose](#running-locally-with-docker-compose)
- [Choosing a database: VPN or local seeded Oracle](#choosing-a-database-vpn-or-local-seeded-oracle)
- [Authentication](#authentication)
- [Roles and permissions](#roles-and-permissions)
- [Testing](#testing)
- [Working outside containers](#working-outside-containers)
- [Corporate certificates (Zscaler / proxy)](#corporate-certificates-zscaler--proxy--local-dev-only)
- [Troubleshooting](#troubleshooting)
- [CI/CD pipelines](#cicd-pipelines)
- [OpenShift deployment](#openshift-deployment)
- [Further documentation](#further-documentation)
- [Contributing](#contributing)

## Prerequisites

**To run the stack in containers** (the common case):

- Docker Compose or Podman Compose
- A database — either VPN access to the shared Oracle instance, or the local seeded Oracle
  image. See [Choosing a database](#choosing-a-database-vpn-or-local-seeded-oracle).

**Only if you build or test outside the containers** — see
[Working outside containers](#working-outside-containers):

| Tool | Version | Used for |
|---|---|---|
| JDK | 21 | Backend compile/test (`<java.version>21</java.version>`) |
| Maven | 3.9+ | Backend build (or use the containerized build) |
| Node.js | ≥ 24 | Frontend and e2e suite (`engines` in `package.json`) |
| npm | ≥ 10 | Frontend and e2e suite |

> The backend image builds on JDK 21 and runs on a JRE 25 base; bytecode targets 21.

## Project structure

```
backend/                  Spring Boot 4 API (Java 21)
  src/main/java/.../csp/backend/
    controller/           REST controllers + DTOs (16 API interfaces)
    service/              Business services, Jasper reporting, mappers
    repository/           JdbcTemplate data access (no JPA — see ARCHITECTURE.md)
    invoice/              Invoice domain: submission (ESF/XML) + manual pipelines
    config/               Security, caching, datasource, Jasper, OpenAPI
    security/ filter/     JWT and mock-auth request filters
  src/main/resources/
    reports/              JasperReports .jrxml designs (R06–R13, PDF + CSV variants)
    schemas/csp/          ESF submission XSDs
  certs/                  Local-only corporate CA certs (git-ignored)

frontend/                 React 19 + Carbon SPA (Vite 8, TypeScript)
  src/pages/              One folder per route (17 pages)
  src/components/         Form, Layout, and core shared components
  src/context/            Auth, theme, layout, notifications, page title
  src/config/             API client, FAM, React Query, test setup
  e2e/                    BDD end-to-end suite — see frontend/e2e/README.md
  Caddyfile               Production static server + /api reverse proxy + CSP headers

common/openshift.init.yml One-time OpenShift objects, incl. the runtime config ConfigMap
monitoring/alerts/        Sysdig alert definitions synced after prod deploys
docs/                     Business rules, refactor plans, investigations
.github/workflows/        CI/CD — see CI/CD pipelines below
```

## Running locally with Docker Compose

**1. Configure your environment**

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | yes | `prod` (mirrors OpenShift, all vars required) or `local` (empty fallbacks, mock auth on, DEBUG logging) |
| `SPRING_DATASOURCE_URL` | yes | Oracle JDBC URL — **TCPS descriptor form**, see note below |
| `SPRING_DATASOURCE_USERNAME` | yes | Oracle username |
| `SPRING_DATASOURCE_PASSWORD` | yes | Oracle password |
| `CSP_OIDC_ISSUER_URI` | real auth | CSS environment issuer |
| `CSP_OIDC_CLIENT_ID` | real auth | Public CSS client ID |
| `AUTH_MOCK_ENABLED` | for local dev | `true` enables backend mock auth — see [Authentication](#authentication) |
| `AUTH_MOCK_ROLES` | no | Roles for the mock user: `ADMIN`, `APPROVE`, `VIEW` (comma-separated). Default `ADMIN` |
| `JAVA_OPTS` | no | JVM flags for the backend container; defaults to container-aware heap sizing |

> Use single quotes if a value contains special characters: `PASSWORD='p@ss!'`

> **For the shared Oracle instance, the JDBC URL must use the TCPS descriptor form.** The
> short `@//host:port/service` form bypasses the Oracle wallet and fails with PKIX certificate
> errors. See `.env.example` for the exact shape. The local seeded image is the exception —
> it serves plain TCP, so the short form is correct there.

`.env.example` defaults to `SPRING_PROFILES_ACTIVE=prod`, which mirrors OpenShift. Setting
`local` instead turns on mock auth by default and raises logging to DEBUG for
`ca.bc.gov.nrs.csp` and Spring Security.

> **Neither profile starts without integrations.** This is the most common first-run failure,
> and the `local` profile does not exempt you from it:
>
> - **Database.** `ValidatingDataSource` runs `SELECT 1 FROM DUAL` during startup and the app
>   refuses to boot if the DB is unreachable. You need a working database either way — VPN and
>   credentials, or the local seeded image.
> - **SSO.** Real authentication requires the CSS issuer/client; local mock authentication does not.
>
> The frontend container waits on the backend's health check, so a backend that fails to start
> takes the frontend down with it — the symptom you see is the frontend never coming up.

**2. Choose frontend authentication**

The tracked `frontend/public/config.js` enables local mock authentication. Deployed
environments replace it with the public CSS runtime configuration. For real sign-in, use
`frontend/public/config.example.js` and the setup in [Modern FAM authentication](docs/fam-keycloak-migration.md).

**3. Connect to a database, then start**

Connect VPN (or start the local seeded Oracle image — see
[Choosing a database](#choosing-a-database-vpn-or-local-seeded-oracle)).

By default, `docker compose up` runs the frontend as a **Vite dev server** with hot-module reloading (via `docker-compose.override.yml`). The source tree is bind-mounted so edits on the host reload live.

```bash
# Docker
docker compose up --build

# Podman
podman compose up --build
```

| Service | URL |
|---|---|
| Frontend (dev server) | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api/swagger-ui/index.html |

> The backend is not exposed directly. All `/api/*` traffic is proxied through the frontend container to the backend.

**Running the production image locally**

To run the production Caddy build (static files, no HMR) instead of the dev server:

```bash
docker compose -f docker-compose.yml up --build
```

**Common commands**

```bash
# Stop and remove containers
docker compose down

# View logs (all services)
docker compose logs -f

# View logs for one service
docker compose logs -f backend

# Rebuild a single service
docker compose up --build backend

# Stop without removing containers
docker compose stop
```

## Choosing a database: VPN or local seeded Oracle

There are two ways to get a database, and which you pick drives your `.env`.

**Option A — shared Oracle over VPN.** The production-shaped option, and the only one with
current data.

- VPN (Cisco Secure Client) connected
- `hosts` file entries for the DB — ask your team for the values
- `SPRING_DATASOURCE_*` pointed at the shared instance, TCPS descriptor form

**Option B — local seeded Oracle in Docker.** No VPN required. A published image carries a
real-data snapshot (50 submissions / 2,273 invoices / 15,122 line items), which is enough for
most feature work and is what the e2e suite runs against.

```bash
docker login ghcr.io -u <your-github-username>    # PAT with read:packages (private package)
docker run -d --name real-data-seeded-csp-db -p 1525:1521 \
  ghcr.io/cgi-bc/nr-mof-oracle-csp-real-test-data-seeded:latest
```

Service `DBDOCK_01`, user/password `THE`/`default`. Allow **~40 seconds** — `docker ps` reports
`Up` well before Oracle accepts connections, and the listener transiently returns `ORA-12514`
while starting. Poll for a real connection rather than trusting container status.

Then in `.env`:

```bash
SPRING_PROFILES_ACTIVE=local
SPRING_DATASOURCE_URL='jdbc:oracle:thin:@//host.docker.internal:1525/DBDOCK_01'
SPRING_DATASOURCE_USERNAME=THE
SPRING_DATASOURCE_PASSWORD=default
```

> The short `@//host:port/service` URL form is correct **here** — the local image serves plain
> TCP, not TCPS, so there is no wallet to apply.

Full details on the seeded image — how it is built, how to refresh it, how to reset to the
snapshot, and how to tell which database you are actually connected to — are in
**[`frontend/e2e/README.md`](frontend/e2e/README.md)**.

## Authentication

Browser authentication uses modern FAM / BC Gov CSS OpenID Connect with PKCE. API calls carry
access tokens; the backend validates this environment's issuer and client, token type and
identity. See [the migration/setup guide](docs/fam-keycloak-migration.md) for exact GitHub
variables, CSS callbacks, role mapping, acceptance and rollback steps.

Local mock mode requires both `mockUser: true` in `frontend/public/config.js` and
`AUTH_MOCK_ENABLED=true` in the backend. The frontend also verifies a localhost origin.
Mock mode does not need SSO configuration. Real mode requires `CSP_OIDC_ISSUER_URI` and
`CSP_OIDC_CLIENT_ID` in both backend and frontend configuration.

## Roles and permissions

CSP retains three IDIR staff roles from the approved CSP client:

| FAM code | Internal role | Existing permission set |
| --- | --- | --- |
| `CSP_ADMIN` | `ADMIN` | Existing admin permissions |
| `CSP_APPROVE` | `APPROVE` | Existing entry and review permissions |
| `CSP_VIEW` | `VIEW` | Existing read/export permissions |

Role codes must match exactly (case-insensitive). Bare or foreign-app roles grant no CSP
access. Business BCeID industry capabilities/client scope remain a separate authorization
work package and do not inherit these staff permissions.

Authorization is **action-level, not role-level**. Controllers declare the specific action they
need and a role→action map decides:

```java
@PreAuthorize("@permissionService.hasPermission(authentication, 'invoiceDetails/Approve')")
```

Action strings use the exact names from the FAM permission matrix — a page (`invoiceDetails`)
or a page sub-action (`invoiceDetails/Approve`). The catalogue and the role→action map live in
`backend/.../util/constants/PermissionConstants.java`, and the frontend keeps a mirrored copy
in `permissions.ts` to drive button visibility. **The two must be kept in sync.**

Locally, `AUTH_MOCK_ROLES` sets the mock user's roles, and the UI's mock role selector
(`components/Layout/MockRoleSelector`) switches between them without a restart.

## Testing

Three layers, each run independently.

### Backend — unit and integration

```bash
cd backend

mvn test                 # unit tests (surefire)
mvn verify               # unit + integration tests (failsafe, *IT.java)
mvn verify -DskipITs     # unit tests only, still produces coverage
```

Integration tests (`*IT.java`) spin up a real Oracle via **Testcontainers**
(`testcontainers-oracle-free`), so Docker must be running and the first run pulls a sizeable
image. They do not need VPN.

JaCoCo writes three reports under `backend/target/site/`:

| Report | Covers |
|---|---|
| `jacoco/` | Unit tests |
| `jacoco-it/` | Integration tests |
| `jacoco-merged/` | Both combined — this is what SonarCloud consumes |

### Frontend — unit and component

```bash
cd frontend

npm test                 # watch mode, node project
npm run test:unit        # *.unit.test.{ts,tsx} in happy-dom
npm run test:browser     # *.browser.test.{ts,tsx} in real Chromium
npm run test:coverage    # node project with v8 coverage -> frontend/coverage/
npm run test:ci          # single run, CI reporter
```

Vitest is split into two projects. The **node** project runs in happy-dom and is the default.
The **browser** project runs in real Chromium via Playwright and is **opt-in** behind
`VITEST_BROWSER_ENABLED=true` — without that guard Vitest initialises the Playwright provider
at startup even when `--project node` is passed, which triggers a Chromium download. The
`test:browser` script sets it for you.

> On a machine with no bundled Chromium (e.g. a WSL/Ubuntu release Playwright doesn't support
> yet), set `PLAYWRIGHT_CHANNEL=chrome` to fall back to a system-installed browser.

### End-to-end — BDD (Gherkin + Playwright)

The e2e suite lives in `frontend/e2e/` as a **nested npm project with its own
`package.json`**, and is a BDD suite: `.feature` files are the executable spec, `playwright-bdd`
compiles them into Playwright tests, and a step layer implements the Gherkin against page
objects.

```bash
cd frontend/e2e
npm install
npm test                 # chromium, excluding @discovered-divergence
npm run test:headed      # watch it run
npm run test:ui          # Playwright UI mode
npm run test:divergences # scenarios tracking confirmed app defects — red on purpose
npm run report           # open the last HTML report
```

It needs the **full stack running** — seeded Oracle, backend on `:8080`, frontend on `:3000` —
and `AUTH_MOCK_ENABLED=true` on that backend, or every `/api` call 401s while `/api/health`
still returns 200.

> **📖 Read [`frontend/e2e/README.md`](frontend/e2e/README.md) before running the e2e suite.**
> It is the authoritative guide and covers everything this section does not: the exact
> stack-up commands, the one-time `NODE_EXTRA_CA_CERTS` step for `playwright install` behind
> the corporate TLS proxy, running the e2e stack alongside your delivery stack on a second
> port, resetting the database to its snapshot, confirming which database you are on, scenario
> tags, the suite layout by domain and use case, why `@playwright/test` is pinned exactly, and
> a "four things that will bite you" section. Companion docs sit beside it:
> [`coverage-guide.md`](frontend/e2e/coverage-guide.md) and
> [`defects-guide.md`](frontend/e2e/defects-guide.md), plus per-use-case `coverage.md` and
> `defects.md` files under `frontend/e2e/features/`.

## Working outside containers

Compose is the supported path, but both halves run natively.

```bash
# Backend — needs JDK 21 + Maven, and .env values exported into your shell
cd backend && mvn spring-boot:run

# Frontend — needs Node >= 24
cd frontend && npm install && npm start      # Vite dev server on :3000
```

The Vite dev server proxies `/api` to `http://localhost:8080` by default; override with
`REACT_APP_API_TARGET`. Other local-only frontend env vars: `VITE_PUBLIC_URL` (base path) and
`VITE_USE_POLLING` (filesystem polling, needed inside Docker/WSL).

Linting and formatting:

```bash
cd frontend
npm run lint             # ESLint over src/**/*.{ts,tsx}
npm run format           # Prettier write
```

`backend/google_checks.xml` holds Google's Checkstyle ruleset for IDE import — it is **not**
wired into the Maven build, so there is no `mvn checkstyle:check` step.

`.pre-commit-config.yaml` configures a single [gitleaks](https://github.com/gitleaks/gitleaks)
hook that scans staged changes for committed secrets. To enable it:

```bash
pre-commit install
```

## Corporate certificates (Zscaler / proxy) — local dev only

If your machine routes traffic through a corporate TLS proxy (e.g. Zscaler), the JVM inside the backend container needs to trust the proxy's root certificate or outbound HTTPS calls will fail with `SSLHandshakeException`.

This is a **local development concern only.** Certificate files are git-ignored (`/backend/certs/*`), so they are never committed and never present in CI/CD builds.

**How it works**

The backend Dockerfile handles certificates in **two separate stages**, and they accept
different things:

| Stage | Reads | Fixes |
|---|---|---|
| Maven build | `backend/certs/*.pem` **only** | Dependency downloads failing behind the proxy during `mvn package` |
| JRE trust store | `backend/certs/*.cer`, `*.pem`, `*.crt` | The running app's outbound HTTPS calls |

Empty or missing files are silently skipped in both. **If your Maven build is the thing
failing, the certificate must be a `.pem`** — a `.cer` or `.crt` is picked up for the runtime
trust store but never reaches the build stage.

**Adding a certificate**

1. Export the corporate root certificate from your browser or certificate manager (DER/PEM format).
2. Drop the file into `backend/certs/` — e.g. `backend/certs/zscaler.cer`.
3. Rebuild the backend image:

```bash
docker compose up --build backend
```

The filename (without extension) becomes the alias in the trust store. Multiple certificates are supported — add one file per certificate.

> Only the `.gitkeep` placeholder is tracked in git. Do **not** force-add cert files to git.

**The Node half — `npx playwright install` fails**

Node does **not** use the system trust store; it ships its own CA list. So `npm` and `git`
work behind the proxy while Playwright's browser download fails with
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, which does not read like a certificate problem:

```bash
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt npx playwright install chromium
```

Export `NODE_EXTRA_CA_CERTS` in your shell profile to avoid rediscovering this. Note that
`frontend/.npmrc` sets `playwright_skip_browser_download=1`, so `npm install` never fetches
browsers — you must run the install above explicitly.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| UI loads, user looks signed in, but every API call returns 401 | Backend mock auth off — only the frontend half is on | Set `AUTH_MOCK_ENABLED=true` in `.env` and restart the backend |
| Pod is "healthy" but every request fails | `/api/health` returns a hardcoded `UP` and never touches the DB — and it is the liveness probe | Check the backend logs; don't trust health for DB state |
| `PKIX path building failed` / certificate errors from Oracle | JDBC URL uses the short `@//host:port/service` form, bypassing the wallet | Use the TCPS descriptor form — see `.env.example` |
| `ORA-12514` right after starting the seeded DB container | Oracle listener still coming up; `docker ps` reports `Up` early | Wait ~40 s and poll for a real connection |
| Backend fails to start under the `prod` profile | A required var is unset — `prod` has no fallbacks | Fill in the table in [step 1](#running-locally-with-docker-compose), or switch to `SPRING_PROFILES_ACTIVE=local` |
| `SSLHandshakeException` on backend outbound HTTPS | JVM doesn't trust the corporate proxy CA | [Add the certificate](#corporate-certificates-zscaler--proxy--local-dev-only) to `backend/certs/` |
| `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` from `playwright install` | Node ignores the system trust store | Set `NODE_EXTRA_CA_CERTS` — see above |
| Host edits don't trigger a reload in the compose dev server | FS events don't cross the Docker/WSL boundary | Already handled by `VITE_USE_POLLING=true` in the override file — confirm it is set |
| First user after a deploy sees slow lookups | Reference-data caches cold | Expected and mitigated by startup warm-up — see `docs/investigations/reference-data-cold-start.md` |

## CI/CD pipelines

All workflows live in `.github/workflows/`.

| Workflow | Trigger | What it does |
|---|---|---|
| `pr-open.yml` | PR opened/updated | Builds backend + frontend images to GHCR, deploys a PR-specific OpenShift environment, runs the reusable test suite |
| `pr-validate.yml` | PR opened/updated | Validates the PR title against Conventional Commits |
| `analysis.yml` | Push, PR, schedule | Backend tests (Maven) and frontend tests, SonarCloud analysis for both, Trivy security scan with results uploaded as CodeQL SARIF |
| `reusable-tests.yml` | Called by PR/merge | Backend integration tests, API integration tests (`common/tests/integration`), and the Playwright e2e suite, uploading reports as artifacts |
| `reusable-deploy.yml` | Called by PR/merge | Deploys backend and frontend to a given OpenShift zone |
| `merge.yml` | Push to `main` | Deploys to **test** → runs tests → deploys to **prod** → syncs Sysdig alerts → promotes images to the `prod` tag |
| `pr-close.yml` | PR closed | Tears down the PR environment and promotes images |
| `scheduled.yml` | Cron / manual | Closes stale branches and PRs, purges old PR deployments, regenerates SchemaSpy docs, runs OWASP ZAP full scans |

Sysdig alert definitions are version-controlled in `monitoring/alerts/` (`replicas.json`,
`crashloop.json`, `restarts.json`) and synced automatically after a prod deploy.

## OpenShift deployment

Deployments to OpenShift are fully automated through GitHub Actions — no manual steps are needed once the secrets and variables are configured.

**Pipeline overview**

| Event | What happens |
|---|---|
| PR opened | Images built, pushed to GHCR, deployed to a PR-specific environment — zone is the **PR number mod 50**, running lite (one replica, no HPA or PDB) |
| Merged to `main` | Images deployed to **test**, integration tests run, then deployed to **prod** |
| After prod deploy | Sysdig monitoring alerts synced; images tagged `prod` in GHCR |

**Oracle init container**

The backend pod uses an init container (`ghcr.io/bcgov/nr-forest-client/common:prod`) that runs before the app starts. It connects to the Oracle host on port 1543 (TCPS) using `KEYSTORE_SECRET` to fetch and write an Oracle wallet into a shared volume (`/cert`). The main container mounts this volume and the entrypoint script merges the wallet cert into the JVM trust store at startup.

**GitHub Secrets & Variables**

The following secrets and variables must be configured on the repository for the pipeline to work.

**Repository secrets**

| Secret | Description |
|---|---|
| `DATABASE_HOST` | Oracle DB hostname |
| `DATABASE_SERVICE_NAME` | Oracle service name |
| `SPRING_DATASOURCE_URL` | Full JDBC URL (TCPS descriptor form) |
| `SPRING_DATASOURCE_USERNAME` | Oracle username |
| `SPRING_DATASOURCE_PASSWORD` | Oracle password |
| `KEYSTORE_SECRET` | Used by the init container to authenticate against the Oracle keystore |
| `OC_NAMESPACE` | OpenShift namespace to deploy into |
| `OC_TOKEN` | OpenShift service account token (repo-level fallback) |
| `SONAR_TOKEN_BACKEND` | SonarCloud token for backend analysis |
| `SONAR_TOKEN_FRONTEND` | SonarCloud token for frontend analysis |
| `SYSDIG_API_TOKEN` | Sysdig monitoring token |

**Environment secrets** (scoped to `test` and `prod` — override the repo-level `OC_TOKEN`)

| Secret | Description |
|---|---|
| `OC_TOKEN` | Environment-specific OpenShift service account token |

**Variables**

Set `CSP_OIDC_ISSUER_URI` and `CSP_OIDC_CLIENT_ID` in the `dev`, `test`, and `prod`
GitHub Environments. Auth configuration is generated by the environment-bound init job.
Keep existing database/OpenShift/logging settings. The complete retirement and rollback
instructions are in [Modern FAM authentication](docs/fam-keycloak-migration.md).

## Further documentation

| Document | What's in it |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Tech stack, system design, data access, auth flow, reporting pipeline |
| [`frontend/e2e/README.md`](frontend/e2e/README.md) | **End-to-end testing** — stack setup, seeded DB, tags, layout, pitfalls |
| [`frontend/e2e/coverage-guide.md`](frontend/e2e/coverage-guide.md) | How per-use-case `coverage.md` files are written |
| [`frontend/e2e/defects-guide.md`](frontend/e2e/defects-guide.md) | How discovered defects are recorded and tracked |
| [`docs/submission-validation-business-rules.md`](docs/submission-validation-business-rules.md) | Every business rule applied to an electronic ESF submission, ported from the legacy app |
| [`docs/refactor-shared-invoice-rules.md`](docs/refactor-shared-invoice-rules.md) | Planned refactor to share invoice rules between the electronic and manual paths |
| [`docs/investigations/reference-data-cold-start.md`](docs/investigations/reference-data-cold-start.md) | Why reference-data caching and startup warm-up exist |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branching strategy and commit conventions |
| [`SECURITY.md`](SECURITY.md) | How to report a vulnerability |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Contributor code of conduct |

API documentation is generated from the code and served by the running app at
`http://localhost:3000/api/swagger-ui/index.html` (OpenAPI JSON at `/api/v3/api-docs`).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full workflow. In short: branch off a fresh
`main` with a type prefix (`feat/`, `fix/`, `chore/`, `docs/`), use
[Conventional Commits](https://www.conventionalcommits.org/) — `pr-validate.yml` enforces this
on the PR title — and open a PR back to `main`.
