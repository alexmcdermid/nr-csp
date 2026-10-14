import { afterEach, describe, expect, it, vi } from 'vitest';

const baseConfig = { appEnv: 'dev', oidcIssuerUri: 'https://sso.test/realms/standard', oidcClientId: 'csp-browser' };

/** Re-imports the module so its module-level reads re-run with current globals. */
async function importFamConfig() {
  vi.resetModules();
  const mod = await import('@/config/fam/config');
  return mod.famConfig;
}

describe('famConfig', () => {
  afterEach(() => {
    globalThis.appConfig = undefined;
  });

  it('reads clientId and environment from globalThis.appConfig', async () => {
    globalThis.appConfig = { ...baseConfig, famClientId: 'fam-client-123', appEnv: 'prod' };

    const famConfig = await importFamConfig();
    expect(famConfig.clientId).toBe('fam-client-123');
    expect(famConfig.environment).toBe('prod');
  });

  it('defaults clientId to empty string when famClientId is missing', async () => {
    globalThis.appConfig = { ...baseConfig, appEnv: 'test' };

    const famConfig = await importFamConfig();
    expect(famConfig.clientId).toBe('');
    expect(famConfig.environment).toBe('test');
  });

  it('falls back to empty clientId and "dev" environment without appConfig', async () => {
    globalThis.appConfig = undefined;

    const famConfig = await importFamConfig();
    expect(famConfig.clientId).toBe('');
    expect(famConfig.environment).toBe('dev');
  });
});
