import type { GmailErrorDetails } from './types';

/**
 * Normalised Gmail API error.
 *
 * Wraps the raw googleapis error and exposes structured metadata so callers can
 * make retry / backoff decisions without parsing error bodies themselves.
 */
export class GmailApiError extends Error {
  readonly code: number;
  readonly status: string | undefined;
  readonly isRateLimit: boolean;
  readonly isAuthError: boolean;
  readonly retryAfterMs: number | null;
  readonly originalError: unknown;

  constructor(details: GmailErrorDetails) {
    super(details.message);
    this.name = 'GmailApiError';
    this.code = details.code;
    this.status = details.status;
    this.isRateLimit = details.isRateLimit;
    this.isAuthError = details.isAuthError;
    this.retryAfterMs = details.retryAfterMs;
    this.originalError = details.originalError;
  }

  toJSON(): GmailErrorDetails {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      isRateLimit: this.isRateLimit,
      isAuthError: this.isAuthError,
      retryAfterMs: this.retryAfterMs,
      originalError: this.originalError,
    };
  }
}

/**
 * Normalise any caught error into a {@link GmailApiError}.
 *
 * Works with googleapis GaxiosError and plain Error/unknown values.
 */
export function normalizeGmailError(error: unknown): GmailApiError {
  if (error instanceof GmailApiError) return error;

  // googleapis errors expose `.code`, `.response.status`, `.response.headers`
  const err = error as Record<string, unknown> | undefined;
  const code = (err?.code as number) ?? (err?.status as number) ?? 500;
  const message =
    (err?.message as string) ?? (typeof err?.toString === 'function' ? String(err) : 'Unknown Gmail API error');

  const responseHeaders = (err?.response as Record<string, unknown>)?.headers as Record<string, string> | undefined;

  const retryAfterHeader = responseHeaders?.['retry-after'];
  const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : null;

  return new GmailApiError({
    code,
    message,
    status: typeof code === 'number' ? String(code) : undefined,
    isRateLimit: code === 429,
    isAuthError: code === 401 || code === 403,
    retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : null,
    originalError: error,
  });
}
