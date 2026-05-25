import { logSubmissionServiceConfigFailure } from "@/lib/submission-env";
import {
  getSubmissionSupabaseClient,
  type SubmissionSupabaseClient,
} from "@/lib/submission-supabase";

/** Max portfolio review requests per email address per rolling hour. */
export const MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR = 3;

/**
 * Limits abuse by counting recent submissions for the same email.
 */
export async function checkSubmissionRateLimit(
  email: string,
  existing?: SubmissionSupabaseClient | null,
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const resolved = existing ?? getSubmissionSupabaseClient();
  if (!resolved) {
    logSubmissionServiceConfigFailure("submissions/rate-limit");
    return {
      allowed: false,
      message: "Submission service is temporarily unavailable. Please try again later.",
    };
  }

  const { client: supabase, mode } = resolved;
  let count = 0;
  let errorMessage: string | undefined;

  if (mode === "service_role") {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: c, error } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("email", email.toLowerCase())
      .gte("created_at", since);
    count = c ?? 0;
    errorMessage = error?.message;
  } else {
    const { data, error } = await supabase.rpc("count_submissions_last_hour", {
      p_email: email,
    });
    count = typeof data === "number" ? data : 0;
    errorMessage = error?.message;
  }

  if (errorMessage) {
    console.warn("[submissions] Rate limit check failed:", errorMessage, { mode });
    return {
      allowed: false,
      message: "Could not verify submission limits. Please try again in a few minutes.",
    };
  }

  if (count >= MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR) {
    return {
      allowed: false,
      message: `You can submit at most ${MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR} portfolio reviews per hour. Please try again later.`,
    };
  }

  return { allowed: true };
}
