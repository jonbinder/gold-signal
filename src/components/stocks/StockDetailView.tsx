import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StockLogo } from "@/components/stocks/StockLogo";
import {
  formatAsOfDate,
  formatInsiderNetLabel,
  formatMarketCapDisplay,
} from "@/lib/stock-facts";
import type { StockDetailPageModel } from "@/lib/stock-detail/types";
import { getTeachingSnippet } from "@/lib/whats-new/teaching-snippets";
import { formatUsdCompact } from "@/lib/whats-new/format";

function fmtShares(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function fmtUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function changeLabel(changeType: string | null): string {
  if (!changeType) return "";
  const map: Record<string, string> = {
    new: "New position",
    add: "Added shares",
    reduce: "Reduced",
    sell: "Sold out",
    unchanged: "Unchanged",
  };
  return map[changeType] ?? changeType;
}

function TeachingBlock({ label, snippetKey }: { label: string; snippetKey: string }) {
  return (
    <p className="stock-detail-teaching">
      <span className="stock-detail-teaching__label">{label}</span>
      {getTeachingSnippet(snippetKey)}
    </p>
  );
}

function SectionShell({
  title,
  subtitle,
  children,
  id,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="stock-detail-section" id={id} aria-labelledby={`${id}-title`}>
      <header className="stock-detail-section__header">
        <h2 id={`${id}-title`} className="stock-detail-section__title">
          {title}
        </h2>
        {subtitle ? <p className="stock-detail-section__sub">{subtitle}</p> : null}
      </header>
      <div className="stock-detail-section__body">{children}</div>
    </section>
  );
}

export function StockDetailView({ model }: { model: StockDetailPageModel }) {
  const sym = model.ticker;
  const netLabel = formatInsiderNetLabel(model.insiderNet90dUsd);
  const asOf = formatAsOfDate(model.insiderAsOf);
  const inst = model.institutional;

  return (
    <div className="stock-detail-page">
      <header className="stock-detail-header">
        <div className="stock-detail-header__inner">
          <Link href="/stocks" className="stock-detail-back mono">
            <ChevronLeft className="size-4" aria-hidden />
            All stocks
          </Link>

          <div className="stock-detail-header__main">
            <div className="stock-detail-header__logo">
              {model.logoUrl ? (
                <Image
                  src={model.logoUrl}
                  alt=""
                  width={88}
                  height={88}
                  className="stock-detail-header__logo-img"
                  unoptimized={model.logoUrl.includes(".svg")}
                />
              ) : (
                <StockLogo ticker={sym} logoUrl="" size={56} />
              )}
            </div>
            <div className="stock-detail-header__text">
              <div className="stock-detail-header__tags">
                {model.exchange ? (
                  <span className="stock-detail-chip stock-detail-chip--exchange mono">{model.exchange}</span>
                ) : null}
                <span className="stock-detail-chip stock-detail-chip--metal">{model.metalTag}</span>
              </div>
              <h1 className="stock-detail-header__name">{model.name}</h1>
              <p className="stock-detail-header__ticker mono">{sym}</p>
              <p className="stock-detail-header__sector">{model.sectorLabel}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="stock-detail-main">
        <SectionShell
          id="insider"
          title="Recent insider activity"
          subtitle={`SEC Form 4 · non-derivative common stock${asOf ? ` · as of ${asOf}` : ""}`}
        >
          <div
            className={`stock-detail-net mono ${
              netLabel.tone === "buy"
                ? "stock-detail-net--buy"
                : netLabel.tone === "sell"
                  ? "stock-detail-net--sell"
                  : ""
            }`}
          >
            90-day net: {netLabel.text}
          </div>

          {model.insider.length === 0 ? (
            <p className="stock-detail-empty">
              {model.insiderEmptyReason === "not_cached"
                ? "Insider data has not been refreshed for this ticker yet."
                : "No recent insider transactions on file."}
            </p>
          ) : (
            <ul className="stock-detail-timeline">
              {model.insider.map((row, i) => (
                <li
                  key={`${row.dateIso}-${row.name}-${i}`}
                  className={`stock-detail-tx stock-detail-tx--${row.type === "BUY" ? "buy" : "sell"}`}
                >
                  <div className="stock-detail-tx__row">
                    <span
                      className={`stock-detail-tx__side ${row.type === "BUY" ? "stock-detail-tx__side--buy" : "stock-detail-tx__side--sell"}`}
                    >
                      {row.type}
                    </span>
                    <time className="stock-detail-tx__date mono" dateTime={row.dateIso}>
                      {row.date}
                    </time>
                  </div>
                  <p className="stock-detail-tx__who">
                    <strong>{row.name}</strong>
                    {row.title ? <span className="stock-detail-tx__role"> · {row.title}</span> : null}
                  </p>
                  <p className="stock-detail-tx__facts mono">
                    {fmtShares(row.shares)} shares
                    {row.valueUsd != null ? ` · ${fmtUsd(row.valueUsd)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <TeachingBlock label="Why this matters" snippetKey={model.teachingKeys.insider} />
        </SectionShell>

        <SectionShell
          id="institutional"
          title="Institutional ownership (13F)"
          subtitle={
            inst.periodLabel
              ? `As of last filed quarter (${inst.periodLabel}) — 13F filings typically lag 45+ days`
              : "Quarterly 13F holdings from tracked precious-metals funds"
          }
        >
          {!inst.available || inst.holderCount === 0 ? (
            <p className="stock-detail-empty">Institutional data unavailable for this ticker.</p>
          ) : (
            <dl className="stock-detail-stats">
              <div>
                <dt>Tracked funds holding</dt>
                <dd className="mono">{inst.holderCount}</dd>
              </div>
              {inst.netChangeSummary ? (
                <div className="stock-detail-stats__wide">
                  <dt>Recent quarter</dt>
                  <dd>{inst.netChangeSummary}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <TeachingBlock label="Why this matters" snippetKey={model.teachingKeys.institutional} />
        </SectionShell>

        <SectionShell id="funds" title="Tracked funds holding this stock">
          {model.fundHolders.length === 0 ? (
            <p className="stock-detail-empty">No tracked funds currently hold this stock.</p>
          ) : (
            <ul className="stock-detail-funds">
              {model.fundHolders.map((f) => (
                <li key={f.slug}>
                  <Link href={`/funds/${f.slug}`} className="stock-detail-fund-card">
                    <span className="stock-detail-fund-card__name">{f.name}</span>
                    <span className="stock-detail-fund-card__meta mono">
                      {f.portfolioPct != null ? `${f.portfolioPct.toFixed(1)}% of portfolio` : ""}
                      {f.changeType ? ` · ${changeLabel(f.changeType)}` : ""}
                      {f.valueUsd != null ? ` · ${formatUsdCompact(f.valueUsd)}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>

        {model.largeStakes.length > 0 ? (
          <SectionShell id="stakes" title="Large stakes (13D / 13G)">
            <ul className="stock-detail-stakes">
              {model.largeStakes.map((s) => (
                <li
                  key={`${s.kind}-${s.filerName}-${s.filingDate}`}
                  className={`whats-new-card whats-new-card--stake stock-detail-stake`}
                >
                  <div className="whats-new-card__meta">
                    <span className={`whats-new-card__badge whats-new-card__badge--${s.kind}`}>
                      {s.kind === "stake_13d" ? "13D" : "13G"}
                    </span>
                    <time className="whats-new-card__date mono" dateTime={s.filingDate}>
                      {s.filingDateLabel}
                    </time>
                  </div>
                  <p className="whats-new-card__headline">
                    {s.filerName} — {s.ownershipPct}% reported stake
                  </p>
                </li>
              ))}
            </ul>
          </SectionShell>
        ) : null}

        <SectionShell id="facts" title="Company facts">
          <dl className="stock-detail-facts-grid">
            <div>
              <dt>CEO</dt>
              <dd>{model.ceo ?? "Not on file"}</dd>
            </div>
            <div>
              <dt>Market cap</dt>
              <dd>{formatMarketCapDisplay(model.marketCap)}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{model.sectorLabel}</dd>
            </div>
            <div>
              <dt>Exchange</dt>
              <dd>{model.exchange ?? "—"}</dd>
            </div>
          </dl>
          {model.description ? (
            <p className="stock-detail-description">{model.description}</p>
          ) : (
            <p className="stock-detail-empty stock-detail-empty--inline">Company description not on file.</p>
          )}
        </SectionShell>

        <p className="stock-detail-compliance">
          Educational information sourced from public SEC filings and exchange data. Not investment advice.
        </p>
      </div>
    </div>
  );
}
