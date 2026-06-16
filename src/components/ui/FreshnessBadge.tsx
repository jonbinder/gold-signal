type FreshnessBadgeProps = {
  label: string;
  className?: string;
};

/** Muted timestamp for filing freshness (Form 4, 13F lag, cache as-of). */
export function FreshnessBadge({ label, className = "" }: FreshnessBadgeProps) {
  if (!label.trim()) return null;
  return (
    <span className={`freshness-badge ${className}`.trim()} title={label}>
      {label}
    </span>
  );
}

export function formatFreshnessDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
