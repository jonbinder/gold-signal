/**
 * Load live data when Supabase is reachable; otherwise use fallback without throwing.
 */
export async function loadWithFallback<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}
