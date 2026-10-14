import { AxiosError } from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as sessionExpiredSignal from '@/context/auth/sessionExpiredSignal';
import { getOidcUser } from '@/service/oidc-service';

import { apiClient } from './request';

vi.mock('@/service/oidc-service', () => ({ getOidcUser: vi.fn(), isSessionEnded: () => false }));
vi.mock('@/env', () => ({ env: { mockUser: false } }));

vi.mock('@/context/auth/sessionExpiredSignal', () => ({
  emitSessionExpired: vi.fn(),
}));

const mockGetOidcUser = vi.mocked(getOidcUser);
const mockEmitSessionExpired = vi.mocked(sessionExpiredSignal.emitSessionExpired);

function axiosErrorWithStatus(status: number | undefined): AxiosError {
  const error = new AxiosError('request failed');
  if (status !== undefined) {
    error.response = { status } as AxiosError['response'];
  }
  return error;
}

describe('apiClient response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOidcUser.mockResolvedValue(null);
  });

  it('emits sessionExpired on a real 401 response', async () => {
    const error = axiosErrorWithStatus(401);
    await expect(apiClient.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);

    expect(mockEmitSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not emit sessionExpired on other error statuses', async () => {
    const error = axiosErrorWithStatus(404);
    await expect(apiClient.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);

    expect(mockEmitSessionExpired).not.toHaveBeenCalled();
  });

  it('does not emit sessionExpired on a response-less network error', async () => {
    const error = axiosErrorWithStatus(undefined);
    await expect(apiClient.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);

    expect(mockEmitSessionExpired).not.toHaveBeenCalled();
  });

  it('does not emit sessionExpired for a non-axios error', async () => {
    const error = new Error('boom');
    await expect(apiClient.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);

    expect(mockEmitSessionExpired).not.toHaveBeenCalled();
  });
});
