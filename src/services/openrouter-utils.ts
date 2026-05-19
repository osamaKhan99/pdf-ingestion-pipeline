const RETRYABLE_PATTERN =
  /provider|overloaded|rate.?limit|timeout|502|503|529|too many requests/i;

export function isRetryableProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (RETRYABLE_PATTERN.test(error.message)) return true;
  const data = getErrorData(error);
  if (data != null && RETRYABLE_PATTERN.test(JSON.stringify(data))) return true;
  return false;
}

export function getErrorData(error: unknown): unknown {
  if (error instanceof Error && "data" in error) {
    return (error as Error & { data?: unknown }).data;
  }
  return undefined;
}

export function formatProviderError(error: unknown, step: string): string {
  const data = getErrorData(error);
  const base =
    error instanceof Error ? error.message : String(error);
  const detail = data != null ? `\n${JSON.stringify(data, null, 2)}` : "";
  return `[${step}] ${base}${detail}`;
}

export async function withProviderRetry<T>(
  step: string,
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && isRetryableProviderError(error)) {
        await sleep(600 * attempt);
        continue;
      }
      throw new Error(formatProviderError(error, step), {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
