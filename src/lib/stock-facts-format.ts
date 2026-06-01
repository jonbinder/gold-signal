/** Client-safe formatting helpers (no Node fs imports). */

export function formatInsiderNetLabel(netUsd: number | null): { text: string; tone: "buy" | "sell" | "neutral" } {
  if (netUsd == null || !Number.isFinite(netUsd)) {
    return { text: "No recent activity on file", tone: "neutral" };
  }
  const abs = Math.abs(netUsd);
  const formatted =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
        ? `$${(abs / 1_000).toFixed(0)}K`
        : `$${Math.round(abs)}`;
  if (netUsd > 0) return { text: `Net buy ${formatted} (90d)`, tone: "buy" };
  if (netUsd < 0) return { text: `Net sell ${formatted} (90d)`, tone: "sell" };
  return { text: "Flat (90d)", tone: "neutral" };
}

export function formatMarketCapDisplay(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatHolderCount(count: number | null): string {
  if (count == null || !Number.isFinite(count)) return "—";
  if (count === 0) return "—";
  return count === 1 ? "1 fund" : `${count} funds`;
}

export function formatAsOfDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
