type MiniReturnSparklineProps = {
  return1mPct: number | null;
  return3mPct: number | null;
  return1yPct: number | null;
  width?: number;
  height?: number;
};

/** Three-point trail from cached trailing returns (not intraday). */
export function MiniReturnSparkline({
  return1mPct,
  return3mPct,
  return1yPct,
  width = 52,
  height = 18,
}: MiniReturnSparklineProps) {
  const points = [return1mPct, return3mPct, return1yPct].map((v) =>
    v != null && Number.isFinite(v) ? v : null,
  );
  const defined = points.filter((p): p is number => p != null);
  if (defined.length < 2) return null;

  const min = Math.min(...defined, 0);
  const max = Math.max(...defined, 0);
  const span = max - min || 1;
  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const coords = points.map((p, i) => {
    const x = pad + (i / 2) * innerW;
    if (p == null) return null;
    const y = pad + innerH - ((p - min) / span) * innerH;
    return `${x},${y}`;
  });

  const path = coords.filter(Boolean).join(" ");
  const last = points[2] ?? points[1] ?? points[0];
  const tone = last == null ? "flat" : last > 0 ? "up" : last < 0 ? "down" : "flat";

  return (
    <svg
      className={`mini-sparkline mini-sparkline--${tone}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function formatReturnPct(value: number | null): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (value == null || !Number.isFinite(value)) return { text: "N/A", tone: "na" };
  const sign = value > 0 ? "+" : "";
  const text = `${sign}${value.toFixed(1)}%`;
  if (value > 0) return { text, tone: "up" };
  if (value < 0) return { text, tone: "down" };
  return { text, tone: "flat" };
}
