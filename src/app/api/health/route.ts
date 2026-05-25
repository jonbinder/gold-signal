import { NextResponse } from "next/server";
import {
  readServiceRoleKey,
  readSupabaseAnonKey,
  readSupabaseUrl,
} from "@/lib/submission-supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — deployment fingerprint (compare to local `git rev-parse HEAD`).
 * Vercel injects VERCEL_GIT_COMMIT_SHA on deploy; null when running locally.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    commitShort: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    env: process.env.VERCEL_ENV ?? null,
    hasProcessSecret: Boolean(process.env.PROCESS_SECRET?.trim()),
    hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    hasSupabaseUrl: Boolean(readSupabaseUrl()),
    hasSupabaseServiceRole: Boolean(readServiceRoleKey()),
    hasSupabaseAnon: Boolean(readSupabaseAnonKey()),
    canSubmitPortfolio: Boolean(
      readSupabaseUrl() && (readServiceRoleKey() || readSupabaseAnonKey()),
    ),
  });
}
