/**
 * Retry wrapper for Anthropic SDK calls.
 *
 * Retries on HTTP 529 (overloaded) and 429 (rate limited) only.
 * Uses exponential backoff starting at 1 s, doubling each attempt, with ±20% jitter.
 * Max 5 attempts (1 original + 4 retries... actually 5 retries = 6 total calls, but
 * per the requirement: max 5 retry *attempts*, so up to 6 total calls).
 */

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const JITTER_FACTOR = 0.2; // ±20%

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 529;
}

function computeDelay(attempt: number): number {
  const base = BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s, 8s, 16s
  const jitter = base * JITTER_FACTOR * (Math.random() * 2 - 1); // ±20%
  return Math.round(base + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts the HTTP status from an Anthropic SDK error.
 * The SDK surfaces status on the error object as `error.status`.
 */
function getErrorStatus(error: unknown): number | null {
  if (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return null;
}

/**
 * Wraps any async function that calls the Anthropic SDK with retry logic.
 *
 * Usage:
 *   const response = await withAnthropicRetry(() =>
 *     anthropic.messages.create({ ... })
 *   );
 */
export async function withAnthropicRetry<T>(
  fn: () => Promise<T>,
  label = "Anthropic API call",
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const status = getErrorStatus(error);
      const isRetryable = status !== null && isRetryableStatus(status);

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw error;
      }

      const delayMs = computeDelay(attempt);
      console.warn(
        `[anthropic-retry] ${label} failed with HTTP ${status}. ` +
          `Retry ${attempt + 1}/${MAX_RETRIES} in ${delayMs}ms...`,
      );
      await sleep(delayMs);
    }
  }

  // Unreachable, but satisfies TypeScript.
  throw lastError;
}
