import { DEFAULT_BACKOFF_CONFIG } from './types';

import type { BackoffConfig } from './types';

/**
 * Exponential backoff with optional jitter.
 *
 * Returns a promise that resolves after the computed delay. The delay grows
 * exponentially up to `maxDelayMs`.
 */
export async function backoff(attempt: number, config: BackoffConfig = DEFAULT_BACKOFF_CONFIG): Promise<void> {
  let delay = config.initialDelayMs * Math.pow(config.multiplier, attempt);
  delay = Math.min(delay, config.maxDelayMs);

  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Retry an async operation with exponential backoff.
 *
 * Retries only on errors where `shouldRetry` returns true. Throws the last
 * error when all retries are exhausted.
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    shouldRetry?: (error: unknown) => boolean;
    config?: BackoffConfig;
  } = {}
): Promise<T> {
  const { maxRetries = 3, shouldRetry = () => true, config = DEFAULT_BACKOFF_CONFIG } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      await backoff(attempt, config);
    }
  }

  throw lastError;
}
