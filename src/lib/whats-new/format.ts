export function formatUsdCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function formatSharesCompact(shares: number | null | undefined): string {
  if (shares == null || !Number.isFinite(shares)) return "";
  if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(2)}M`;
  if (shares >= 1_000) return `${Math.round(shares / 1_000)}K`;
  return shares.toLocaleString("en-US");
}

export function formatFilingDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function windowBounds(days = 7): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function isDateInWindow(dateIso: string, startIso: string, endIso: string): boolean {
  const d = dateIso.slice(0, 10);
  return d >= startIso && d <= endIso;
}
