import { env } from '@/env';

import type { Role } from './permissions';
import type { AuthUser } from './types';

export function famUserFromAccessToken(token: string): AuthUser {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Invalid access token');
  const claims = JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(payload.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0)),
    ),
  ) as Record<string, unknown>;
  const provider = claims.identity_provider;
  const username = provider === 'bceidbusiness' ? claims.bceid_username : claims.idir_username;
  const rolesClaim =
    (Array.isArray(claims.client_roles) && claims.client_roles.length ? claims.client_roles : undefined) ??
    (claims.resource_access as Record<string, { roles?: unknown }> | undefined)?.[env.VITE_OIDC_CLIENT_ID ?? '']?.roles;
  const roles = Array.isArray(rolesClaim)
    ? rolesClaim
        .filter((role): role is string => typeof role === 'string')
        .map((role) => role.trim().toUpperCase())
        .filter((role) => !role.startsWith('FAM:'))
    : [];
  const isStaff = provider === 'idir' || provider === 'azureidir';
  const clientMatches =
    claims.azp === env.VITE_OIDC_CLIENT_ID &&
    claims.iss === env.VITE_OIDC_ISSUER_URI?.replace(/\/+$/, '') &&
    claims.typ === 'Bearer';
  // Industry submitter capabilities/client scope are a separate, approved role contract.
  const privileges: Role[] =
    isStaff && clientMatches
      ? (['ADMIN', 'APPROVE', 'VIEW'] as Role[]).filter((role) => roles.includes(`CSP_${role}`))
      : [];
  return {
    username: typeof username === 'string' ? username : String(claims.sub ?? ''),
    idirUsername: typeof username === 'string' ? username : undefined,
    displayName: String(
      claims.display_name ?? claims.name ?? [claims.given_name, claims.family_name].filter(Boolean).join(' '),
    ),
    email: String(claims.email ?? ''),
    roles,
    privileges,
  };
}
