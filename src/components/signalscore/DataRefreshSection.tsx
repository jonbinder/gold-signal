const REFRESH_ROWS = [
  {
    component: "Insider transactions (Form 4)",
    cadence: "Daily batch refresh; new filings appear on SEC EDGAR within days of the trade",
  },
  {
    component: "Famous investor holdings",
    cadence: "Updated when our curated investor portfolio list is refreshed from public sources",
  },
  {
    component: "Company reference data",
    cadence: "Daily — market cap, exchange, and descriptions from exchange and SEC feeds",
  },
  {
    component: "Stock universe cache",
    cadence: "Rolling refresh across the full tracked universe (~20-hour cycle per ticker)",
  },
] as const;

export function DataRefreshSection() {
  return (
    <section className="ss-block ss-block--refresh" aria-labelledby="ss-refresh-title">
      <h2 id="ss-refresh-title" className="ss-block__title">
        How often data refreshes
      </h2>
      <dl className="ss-refresh">
        {REFRESH_ROWS.map((row) => (
          <div key={row.component} className="ss-refresh__row">
            <dt className="ss-refresh__component">{row.component}</dt>
            <dd className="ss-refresh__cadence">{row.cadence}</dd>
          </div>
        ))}
      </dl>
      <p className="ss-refresh__note" style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-muted, #5C5649)" }}>
        Data sourced from SEC EDGAR (Form 4, 13F), exchange feeds, and curated public disclosures.
        Not investment advice.
      </p>
    </section>
  );
}
