import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const baseConfig = { appEnv: 'dev', oidcIssuerUri: 'https://sso.test/realms/standard', oidcClientId: 'csp-browser' };

/** Re-imports src/env.ts so its module-level logic re-runs with current globals. */
async function importEnv() {
  vi.resetModules();
  const mod = await import('@/env');
  return mod.env;
}

function stubHostname(hostname: string) {
  vi.stubGlobal('window', { location: { hostname } });
}

describe('env', () => {
  beforeEach(() => {
    globalThis.appConfig = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.appConfig = undefined;
  });

  it('enables mockUser when opted in and served from localhost', async () => {
    globalThis.appConfig = { ...baseConfig, mockUser: true };
    stubHostname('localhost');

    const env = await importEnv();
    expect(env.mockUser).toBe(true);
  });

  it('enables mockUser on a *.localhost subdomain', async () => {
    globalThis.appConfig = { ...baseConfig, mockUser: true };
    stubHostname('csp.localhost');

    const env = await importEnv();
    expect(env.mockUser).toBe(true);
  });

  it('disables mockUser on a non-local host even when opted in', async () => {
    globalThis.appConfig = { ...baseConfig, mockUser: true };
    stubHostname('csp.nrs.gov.bc.ca');

    const env = await importEnv();
    expect(env.mockUser).toBe(false);
  });

  it('disables mockUser on localhost without the runtime opt-in', async () => {
    globalThis.appConfig = { ...baseConfig, mockUser: false };
    stubHostname('localhost');

    const env = await importEnv();
    expect(env.mockUser).toBe(false);
  });

  it('disables mockUser when window is undefined (non-browser context)', async () => {
    globalThis.appConfig = { ...baseConfig, mockUser: true };
    vi.stubGlobal('window', undefined);

    const env = await importEnv();
    expect(env.mockUser).toBe(false);
  });

  it('defaults mockUser to false and appEnv to "dev" without appConfig', async () => {
    stubHostname('localhost');

    const env = await importEnv();
    expect(env.mockUser).toBe(false);
    expect(env.appEnv).toBe('dev');
  });

  it('reads appEnv from appConfig when present', async () => {
    globalThis.appConfig = { ...baseConfig, appEnv: 'prod' };
    stubHostname('localhost');

    const env = await importEnv();
    expect(env.appEnv).toBe('prod');
  });

  it('exposes mutually exclusive isDevelopment/isProduction booleans', async () => {
    stubHostname('localhost');

    const env = await importEnv();
    expect(typeof env.isDevelopment).toBe('boolean');
    expect(typeof env.isProduction).toBe('boolean');
    expect(env.isDevelopment).not.toBe(env.isProduction);
  });

  it('defaults idleTimeoutMs to 30 minutes without appConfig', async () => {
    stubHostname('localhost');

    const env = await importEnv();
    expect(env.idleTimeoutMs).toBe(30 * 60_000);
  });

  it('reads idleTimeoutMinutes from appConfig when present', async () => {
    globalThis.appConfig = { ...baseConfig, idleTimeoutMinutes: 90 };
    stubHostname('localhost');

    const env = await importEnv();
    expect(env.idleTimeoutMs).toBe(90 * 60_000);
  });
});
