import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SubmissionSupabaseMode = "service_role" | "anon";

export type SubmissionSupabaseClient = {
  client: SupabaseClient;
  mode: SubmissionSupabaseMode;
};

/**
 * Reads Supabase URL from common env names (Vercel / local).
 */
export function readSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    undefined
  );
}

/**
 * Reads service role key from common env names.
 */
export function readServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    undefined
  );
}

/**
 * Reads anon key (available at Next.js build time via NEXT_PUBLIC_*).
 */
export function readSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

/**
 * Client for portfolio form submit: prefers service role, falls back to anon + RLS (migration 009).
 */
export function getSubmissionSupabaseClient(): SubmissionSupabaseClient | null {
  const url = readSupabaseUrl();
  if (!url) return null;

  const serviceKey = readServiceRoleKey();
  if (serviceKey) {
    return {
      client: createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      mode: "service_role",
    };
  }

  const anonKey = readSupabaseAnonKey();
  if (anonKey) {
    console.warn(
      "[submissions] SUPABASE_SERVICE_ROLE_KEY missing — using anon key for insert (requires migration 009).",
    );
    return {
      client: createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      mode: "anon",
    };
  }

  return null;
}
