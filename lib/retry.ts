interface RetryOptions {
  retries?: number;
  delayMs?: number;
}

function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(503|429|overloaded|rate.?limit|high demand|temporarily unavailable|ECONNRESET|ETIMEDOUT)\b/i.test(
    message,
  );
}

/** Retries transient upstream failures (rate limits, temporary overload) with backoff; fails fast on anything else. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 2, delayMs = 1200 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}
