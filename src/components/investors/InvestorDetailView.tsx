import Link from "next/link";
import { InvestorPhoto } from "@/components/InvestorPhoto";
import { PositionCountLabel } from "@/components/investors/PositionCountLabel";
import { StockLogo } from "@/components/stocks/StockLogo";
import { isInvestorNeedsData } from "@/lib/investors/csv-data";
import { stockPath } from "@/lib/paths";
import type { InvestorDetailModel } from "@/lib/investors/types";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

function sourceBadgeClass(sourceType: string): string {
  if (sourceType.toLowerCase().includes("13f")) return "investor-source-badge investor-source-badge--filing";
  if (sourceType.toLowerCase().includes("13d")) return "investor-source-badge investor-source-badge--filing";
  if (sourceType.toLowerCase().includes("13g")) return "investor-source-badge investor-source-badge--filing";
  if (sourceType.toLowerCase().includes("form 4")) return "investor-source-badge investor-source-badge--filing";
  if (sourceType.toLowerCase().includes("interview")) return "investor-source-badge investor-source-badge--statement";
  if (sourceType.toLowerCase().includes("podcast")) return "investor-source-badge investor-source-badge--statement";
  if (sourceType.toLowerCase().includes("conference")) return "investor-source-badge investor-source-badge--statement";
  if (sourceType.toLowerCase().includes("fact sheet")) return "investor-source-badge investor-source-badge--statement";
  return "investor-source-badge";
}

function formatAsOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric", timeZone: "UTC" });
}

function websiteHref(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

function xProfileHref(handle: string): string {
  const normalized = handle.trim().replace(/^@+/, "");
  return `https://x.com/${encodeURIComponent(normalized)}`;
}

export function InvestorDetailView({ model }: { model: InvestorDetailModel }) {
  const { investor, positions } = model;
  const tracked = new Set(loadTrackedStocksSync().map((s) => s.ticker.toUpperCase()));
  const showWebsite = !isInvestorNeedsData(investor.website ?? "");
  const showX = !isInvestorNeedsData(investor.xHandle);

  return (
    <main className="funds-page">
      <header className="funds-hero">
        <div className="funds-hero__inner funds-hero__inner--with-photo">
          <Link href="/portfolios" className="funds-back">
            ← All portfolios
          </Link>
          <div className="funds-hero__profile">
            <InvestorPhoto
              investor={{ name: investor.name, slug: investor.slug, photoUrl: investor.photoUrl }}
              size="hero"
              priority
              className="funds-hero__photo"
            />
            <div className="funds-hero__copy">
              <p className="funds-hero__eyebrow">
                {investor.type === "fund" ? "Fund profile" : "Investor profile"}
              </p>
              <h1 className="funds-hero__title">{investor.name}</h1>
              {investor.titleRole ? <p className="funds-hero__sub">{investor.titleRole}</p> : null}
            </div>
          </div>
        </div>
      </header>

      <div className="funds-main">
        <section className="investor-bio-section" aria-label="Investor bio">
          <p className="investor-bio-section__text">{investor.bioLong}</p>
          {showWebsite || showX ? (
            <div className="investor-bio-section__links">
              {showWebsite ? (
                <a
                  href={websiteHref(investor.website!)}
                  className="investor-bio-section__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website
                </a>
              ) : null}
              {showX ? (
                <a
                  href={xProfileHref(investor.xHandle)}
                  className="investor-bio-section__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X
                </a>
              ) : null}
            </div>
          ) : null}
        </section>

        <p className="funds-filter-note">
          Notable gold &amp; silver positions held by leading investors and funds — sourced from SEC filings and
          public statements. Not complete portfolios.
        </p>
        {investor.type === "individual" ? (
          <p className="funds-teaching" style={{ marginTop: "0.5rem" }}>
            <span className="funds-teaching__label">Note</span>
            Positions shown are notable disclosed/stated holdings, not a complete portfolio.
          </p>
        ) : null}
        {investor.contextNote ? (
          <p className="funds-teaching" style={{ marginTop: "0.5rem" }}>
            <span className="funds-teaching__label">Context</span>
            {investor.contextNote}
          </p>
        ) : null}

        {positions.length === 0 ? (
          <p className="funds-empty">
            <PositionCountLabel count={0} />
          </p>
        ) : (
          <div className="funds-table-wrap">
            <table className="funds-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>What&apos;s known</th>
                  <th>Approx size</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="funds-table__ticker-cell">
                        <StockLogo ticker={row.ticker} tryServe size={30} />
                        {tracked.has(row.ticker.toUpperCase()) ? (
                          <Link href={stockPath(row.ticker)}>{row.ticker}</Link>
                        ) : (
                          <span className="mono funds-table__ticker-muted" title="Stock page not in tracked universe yet">
                            {row.ticker}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{row.companyName?.trim() || row.ticker}</td>
                    <td>
                      <p style={{ margin: 0 }}>{row.detail}</p>
                      {row.whyInteresting ? (
                        <p style={{ margin: "0.35rem 0 0", color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                          Why interesting: {row.whyInteresting}
                        </p>
                      ) : null}
                    </td>
                    <td className="mono">{row.approxSize ?? "—"}</td>
                    <td>
                      <span className={sourceBadgeClass(row.sourceType)}>
                        {row.sourceType} · {formatAsOf(row.asOfDate)}
                      </span>
                      <p style={{ margin: "0.35rem 0 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {row.sourceDetail}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
