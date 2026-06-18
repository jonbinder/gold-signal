import type { ReactNode } from "react";
import Link from "next/link";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { ChevronLeft } from "lucide-react";
import { StockLogo } from "@/components/stocks/StockLogo";
import { InsiderActivityList } from "@/components/stocks/InsiderActivityList";
import { InsiderTimelineChart } from "@/components/charts/InsiderTimelineChart";
import { SharePriceTimelineChart } from "@/components/charts/SharePriceTimelineChart";
import { HolderCountCard } from "@/components/charts/HolderCountCard";
import { InstitutionalTrendChart } from "@/components/charts/InstitutionalTrendChart";
import { InstitutionalConcentrationDonut } from "@/components/charts/InstitutionalConcentrationDonut";
import { ChartEmpty } from "@/components/charts/ChartCaption";
import { investorPath } from "@/lib/paths";
import {
  formatAsOfDate,
  formatInsiderNetLabel,
  formatMarketCapDisplay,
} from "@/lib/stock-facts";
import type { StockDetailPageModel } from "@/lib/stock-detail/types";
import { getTeachingSnippet } from "@/lib/whats-new/teaching-snippets";
import { formatUsdCompact } from "@/lib/whats-new/format";

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
  const charts = model.charts;

  return (
    <div className="stock-detail-page">
      <header className="stock-detail-header">
        <div className="stock-detail-header__inner">
          <Link href="/portfolios" className="stock-detail-back mono">
            <ChevronLeft className="size-4" aria-hidden />
            All portfolios
          </Link>

          <div className="stock-detail-header__main">
            <div className="stock-detail-header__logo">
              <StockLogo
                ticker={sym}
                logoUrl={model.logoUrl}
                tryServe
                subCategory={model.subCategory}
                size={72}
              />
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
          subtitle="SEC Form 4 · non-derivative common stock"
        >
          {asOf ? (
            <p className="stock-detail-freshness">
              <FreshnessBadge label={`Form 4 as of ${asOf}`} />
            </p>
          ) : null}
          {charts.hasPriceChart ? (
            <div className="stock-detail-viz-block">
              <h3 className="stock-detail-viz-label">Share price (12 mo)</h3>
              <SharePriceTimelineChart data={charts.priceTimeline} />
            </div>
          ) : null}

          <div className="stock-detail-viz-block stock-detail-viz-block--hero">
            <h3 className="stock-detail-viz-label">Buy / sell timeline (12 months)</h3>
            {charts.hasInsiderChart ? (
              <InsiderTimelineChart data={charts.insiderTimeline} />
            ) : (
              <ChartEmpty message="Not enough insider transactions in the last 12 months to chart yet." />
            )}
          </div>

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
            <>
              <h3 className="stock-detail-viz-label">Recent transactions</h3>
              <InsiderActivityList rows={model.insider} />
            </>
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
            <>
              {charts.holderCount ? (
                <div className="stock-detail-viz-block">
                  <HolderCountCard snapshot={charts.holderCount} />
                </div>
              ) : null}

              {charts.hasInstitutionalTrend ? (
                <div className="stock-detail-viz-block">
                  <h3 className="stock-detail-viz-label">Holder count over time</h3>
                  <InstitutionalTrendChart data={charts.institutionalTrend} />
                </div>
              ) : (
                <ChartEmpty message="Not enough quarterly 13F history to chart a trend yet." />
              )}

              {charts.concentration ? (
                <div className="stock-detail-viz-block">
                  <h3 className="stock-detail-viz-label">Ownership concentration</h3>
                  <InstitutionalConcentrationDonut data={charts.concentration} />
                </div>
              ) : null}

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
            </>
          )}

          <TeachingBlock label="Why this matters" snippetKey={model.teachingKeys.institutional} />
        </SectionShell>

        <SectionShell id="funds" title="Tracked investors holding this stock">
          {model.trackedInvestors.length === 0 ? (
            <p className="stock-detail-empty">No tracked investors currently have a sourced position in this ticker.</p>
          ) : (
            <ul className="stock-detail-funds">
              {model.trackedInvestors.map((f) => (
                <li key={f.slug}>
                  <Link href={investorPath(f.slug)} className="stock-detail-fund-card">
                    <span className="stock-detail-fund-card__name">{f.name}</span>
                    <span className="stock-detail-fund-card__meta mono">
                      {f.type === "fund" ? "Fund" : "Individual"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>

        <SectionShell id="funds13f" title="Latest 13F fund holders">
          {model.fundHolders.length === 0 ? (
            <p className="stock-detail-empty">No tracked 13F funds currently hold this stock.</p>
          ) : (
            <ul className="stock-detail-funds">
              {model.fundHolders.map((f) => (
                <li key={f.slug}>
                  <Link href={investorPath(f.slug)} className="stock-detail-fund-card">
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
      </div>
    </div>
  );
}
