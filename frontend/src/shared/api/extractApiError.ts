/**
 * Pull the human-readable error message out of an axios/fetch error.
 * Returns undefined when there is no usable message — callers should fall back to a localized "something went wrong".
 */
export function extractApiError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { detail?: string; message?: string } } })
      .response?.data;
  return data?.detail ?? data?.message;
}
