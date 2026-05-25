/** Structured success/error result for external API calls (no thrown errors). */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; statusCode?: number; retryable?: boolean; source?: string };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail<T>(
  error: string,
  opts?: { statusCode?: number; retryable?: boolean; source?: string },
): ApiResult<T> {
  return { ok: false, error, ...opts };
}
