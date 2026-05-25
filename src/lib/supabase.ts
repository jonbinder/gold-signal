import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  readServiceRoleKey,
  readSupabaseAnonKey,
  readSupabaseUrl,
} from "@/lib/submission-supabase";

let publicClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client using the anon key (respects RLS).
 */
export function createSupabasePublicClient(): SupabaseClient | null {
  if (publicClient) return publicClient;
  const url = readSupabaseUrl();
  const key = readSupabaseAnonKey();
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
  const url = readSupabaseUrl();
  const key = readServiceRoleKey();
  if (!url || !key) return null;
  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
