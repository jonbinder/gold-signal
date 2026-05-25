import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client using the anon key (respects RLS).
 */
export function createSupabasePublicClient(): SupabaseClient | null {
  if (publicClient) return publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  publicClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return publicClient;
}

/**
 * Server-only Supabase client with the service role key (bypasses RLS).
 * Use for API routes and background jobs — never expose to the browser.
 */
export function createSupabaseServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
