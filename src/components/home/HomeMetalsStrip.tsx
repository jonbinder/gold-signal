import type { CachedMetalsMarket } from "@/lib/metals-market-read";

function fmtUsd(value: number | null, kind: "gold" | "silver" | "default" = "default"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = kind === "gold" && value >= 1000 ? 0 : kind === "silver" ? 2 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function fmtChg(pct: number | null): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (pct == null || !Number.isFinite(pct)) return { text: "—", tone: "na" };
  const sign = pct > 0 ? "+" : "";
  const text = `${sign}${pct.toFixed(2)}%`;
  if (pct > 0) return { text, tone: "up" };
  if (pct < 0) return { text, tone: "down" };
  return { text, tone: "flat" };
}

function fmtRatio(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

type StatProps = {
  label: string;
  value: string;
  change: { text: string; tone: "up" | "down" | "flat" | "na" };
  labelClass?: string;
};

function Stat({ label, value, change, labelClass = "" }: StatProps) {
  return (
    <div className="home-metals-strip__stat">
      <span className={`home-metals-strip__label ${labelClass}`.trim()}>{label}</span>
      <span className="home-metals-strip__value tabular-nums">{value}</span>
      <span className={`home-metals-strip__chg home-metals-strip__chg--${change.tone} tabular-nums`}>
        {change.text}
      </span>
    </div>
  );
}

export function HomeMetalsStrip({ metals }: { metals: CachedMetalsMarket | null }) {
  const goldChg = fmtChg(metals?.goldChangePct ?? null);
  const silverChg = fmtChg(metals?.silverChangePct ?? null);
  const ratioChg = fmtChg(metals?.ratioChangePct ?? null);

  return (
    <section className="home-metals-strip" aria-label="Gold and silver market snapshot">
      <div className="home-metals-strip__inner">
        <Stat
          label={metals?.goldLabel ?? "Gold (USD/oz)"}
          value={fmtUsd(metals?.goldPrice ?? null, "gold")}
          change={goldChg}
          labelClass="home-metals-strip__label--gold"
        />
        <Stat
          label={metals?.silverLabel ?? "Silver (USD/oz)"}
          value={fmtUsd(metals?.silverPrice ?? null, "silver")}
          change={silverChg}
          labelClass="home-metals-strip__label--silver"
        />
        <Stat
          label="Gold / Silver ratio"
          value={fmtRatio(metals?.goldSilverRatio ?? null)}
          change={ratioChg}
          labelClass="home-metals-strip__label--ratio"
        />
      </div>
      <p className="home-metals-strip__note mono">
        Physical gold &amp; silver spot · ratio = gold ÷ silver
        {metals?.updatedAt ? ` · ${new Date(metals.updatedAt).toLocaleDateString("en-US")}` : ""}
      </p>
    </section>
  );
}
