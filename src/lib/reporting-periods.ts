import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportingPeriodRow = {
  id: string;
  label: string;
  period_end: string;
};

/**
 * Latest 13F reporting period by period_end (avoids stale is_latest flags in DB).
 */
export async function fetchLatestReportingPeriod(
  supabase: SupabaseClient,
): Promise<ReportingPeriodRow | null> {
  const { data, error } = await supabase
    .from("reporting_periods")
    .select("id, label, period_end")
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data as ReportingPeriodRow;
}
