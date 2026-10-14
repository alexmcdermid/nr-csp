import axios from 'axios';

import { emitSessionExpired } from '@/context/auth/sessionExpiredSignal';
import { env } from '@/env';
import { getOidcUser, isSessionEnded } from '@/service/oidc-service';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

apiClient.interceptors.request.use(async (config) => {
  if (env.mockUser) return config;
  try {
    const user = await getOidcUser();
    if (user?.access_token) config.headers.Authorization = `Bearer ${user.access_token}`;
  } catch (error) {
    if (isSessionEnded(error)) emitSessionExpired();
    // Preserve an active user's form on a transient SSO/network error.
    return Promise.reject(error);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A real 401 from our backend is the one unambiguous signal that the session is
    // actually dead (vs. a transient network/SSO blip) — see RealAuthProvider.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      emitSessionExpired();
    }
    return Promise.reject(error);
  },
);
