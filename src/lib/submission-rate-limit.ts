import { logSubmissionServiceConfigFailure } from "@/lib/submission-env";
import { createSupabaseServiceClient } from "@/lib/supabase";

/** Max portfolio review requests per email address per rolling hour. */
export const MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR = 3;

/**
 * Limits abuse by counting recent submissions for the same email.
 */
export async function checkSubmissionRateLimit(
  email: string,
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    logSubmissionServiceConfigFailure("submissions/rate-limit");
    return {
      allowed: false,
      message: "Submission service is temporarily unavailable. Please try again later.",
    };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .gte("created_at", since);

  if (error) {
    console.warn("[submissions] Rate limit check failed:", error.message);
    return {
      allowed: false,
      message: "Could not verify submission limits. Please try again in a few minutes.",
    };
  }

  if ((count ?? 0) >= MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR) {
    return {
      allowed: false,
      message: `You can submit at most ${MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR} portfolio reviews per hour. Please try again later.`,
    };
  }

  return { allowed: true };
}
