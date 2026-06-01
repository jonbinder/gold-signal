const REFRESH_ROWS = [
  {
    component: "Insider transactions (Form 4)",
    cadence:
      "Refreshed on a rolling schedule as new filings hit SEC EDGAR — typically within days of the trade",
  },
  {
    component: "Institutional holdings (13F)",
    cadence:
      "Updated each quarter after funds file 13F reports (~45 days after quarter-end); fund pages reflect the latest synced period",
  },
  {
    component: "Large stakes (13D / 13G)",
    cadence: "Added when material stake filings are ingested from SEC EDGAR",
  },
  {
    component: "Company reference & prices",
    cadence: "Market cap, exchange, and descriptions from exchange feeds; not hand-entered",
  },
] as const;

export function DataRefreshSection() {
  return (
    <div className="about-refresh" aria-labelledby="about-refresh-title">
      <h3 id="about-refresh-title" className="about-section__title">
        How often data updates
      </h3>
      <dl>
        {REFRESH_ROWS.map((row) => (
          <div key={row.component} className="about-refresh__row">
            <dt className="about-refresh__component">{row.component}</dt>
            <dd className="about-refresh__cadence">{row.cadence}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
