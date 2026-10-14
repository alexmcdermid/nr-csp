export const famConfig = {
  clientId: globalThis.appConfig?.famClientId ?? '',
  environment: globalThis.appConfig?.appEnv ?? 'dev',
} as const;
