import { NextResponse } from 'next/server';

import type { GooglePermissionCheckResult } from '@/lib/accounts';
import { getErrorMessage } from '@/lib/errors';
import type { AppUser } from '@/lib/session-user';

export type ApiMeta = Record<string, unknown>;

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiRouteError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly meta?: ApiMeta;

  constructor(status: number, code: string, message: string, details?: unknown, meta?: ApiMeta) {
    super(message);
    this.name = 'ApiRouteError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.meta = meta;
  }
}

export const apiError = (status: number, code: string, message: string, details?: unknown, meta?: ApiMeta) =>
  new ApiRouteError(status, code, message, details, meta);

export const apiSuccess = <T>(data: T, meta?: ApiMeta): ApiSuccess<T> => ({
  ok: true,
  data,
  ...(meta ? { meta } : {}),
});

export const apiFailure = (code: string, message: string, details?: unknown, meta?: ApiMeta): ApiFailure => ({
  ok: false,
  error: {
    code,
    message,
    ...(details !== undefined ? { details } : {}),
  },
  ...(meta ? { meta } : {}),
});

export const jsonApiSuccess = <T>(data: T, init?: { status?: number; meta?: ApiMeta }) =>
  NextResponse.json(apiSuccess(data, init?.meta), { status: init?.status ?? 200 });

export const jsonApiFailure = (error: ApiRouteError) =>
  NextResponse.json(apiFailure(error.code, error.message, error.details, error.meta), { status: error.status });

export const toApiRouteError = (
  error: unknown,
  fallback: {
    status?: number;
    code: string;
    message: string;
    meta?: ApiMeta;
  }
) => {
  if (error instanceof ApiRouteError) {
    return error;
  }

  return apiError(fallback.status ?? 500, fallback.code, fallback.message, getErrorMessage(error), fallback.meta);
};

export const handleApiRouteError = (
  error: unknown,
  fallback: {
    status?: number;
    code: string;
    message: string;
    meta?: ApiMeta;
  }
) => jsonApiFailure(toApiRouteError(error, fallback));

export const requireAuthenticatedUser = <T extends AppUser>(user: T | null): T => {
  if (!user) {
    throw apiError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  return user;
};

export const assertApi = (
  condition: unknown,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  meta?: ApiMeta
) => {
  if (!condition) {
    throw apiError(status, code, message, details, meta);
  }
};

export const throwPermissionFailure = (failure: Extract<GooglePermissionCheckResult, { ok: false }>): never => {
  throw apiError(
    failure.status,
    failure.status === 403 ? 'GMAIL_PERMISSION_REQUIRED' : 'GOOGLE_ACCOUNT_REQUIRED',
    failure.body.error,
    failure.body
  );
};
