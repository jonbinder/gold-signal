/**
 * Env validation for portfolio review submission (server-side Supabase).
 * See docs/PORTFOLIO_REVIEW_DEPLOYMENT.md
 */

export const SUBMISSION_ENV_DOCS = "docs/PORTFOLIO_REVIEW_DEPLOYMENT.md";

import {
  readServiceRoleKey,
  readSupabaseAnonKey,
  readSupabaseUrl,
} from "@/lib/submission-supabase";

const SUBMISSION_SUPABASE_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export type SubmissionEnvCheck = {
  ok: boolean;
  missing: string[];
  present: string[];
};

/**
 * Returns which Supabase env vars are set (trimmed, non-empty).
 */
export function checkSubmissionSupabaseEnv(): SubmissionEnvCheck {
  const missing: string[] = [];
  const present: string[] = [];

  if (readSupabaseUrl()) {
    present.push("NEXT_PUBLIC_SUPABASE_URL");
  } else {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (readServiceRoleKey()) {
    present.push("SUPABASE_SERVICE_ROLE_KEY");
  } else {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (readSupabaseAnonKey()) {
    present.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  } else if (!readServiceRoleKey()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const ok =
    Boolean(readSupabaseUrl()) &&
    (Boolean(readServiceRoleKey()) || Boolean(readSupabaseAnonKey()));

  return { ok, missing, present };
}

/**
 * Logs a clear error when config is incomplete (call at route module load).
 */
export function logSubmissionEnvConfigOnLoad(routeLabel = "submissions"): void {
  const status = checkSubmissionSupabaseEnv();
  if (status.ok) {
    console.info(`[${routeLabel}] Submission Supabase env OK`, {
      vars: status.present,
    });
    return;
  }

  console.error(`[${routeLabel}] Submission service config check failed at startup`, {
    check: "createSupabaseServiceClient",
    missing: status.missing,
    present: status.present,
    docs: SUBMISSION_ENV_DOCS,
    hint:
      "Set missing vars in Vercel → Settings → Environment Variables → Production, then redeploy.",
  });
}

/**
 * Server-side log when a request fails the Supabase client check.
 */
export function logSubmissionServiceConfigFailure(routeLabel = "submissions"): void {
  const status = checkSubmissionSupabaseEnv();
  console.error(`[${routeLabel}] Submission service config check failed on request`, {
    check: "getSubmissionSupabaseClient() returned null",
    missing: status.missing,
    present: status.present,
    docs: SUBMISSION_ENV_DOCS,
    hint: "Need URL + (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY with migration 009).",
  });
}
