const REFRESH_ROWS = [
  {
    component: "Insider Buying vs Selling",
    cadence: "As new Form 4 filings appear on SEC EDGAR (typically within days of the trade)",
  },
  {
    component: "Institutional 13F Data",
    cadence: "Quarterly, as 13F-HR filings are published (45 days after quarter-end)",
  },
  {
    component: "Famous Investor Portfolio Tracking",
    cadence: "Updated as our tracked-investor holdings list is refreshed from public sources",
  },
  {
    component: "Gold Torque (beta multiplier)",
    cadence: "Daily, recalculated on market close using price history vs GLD or SLV",
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
    </section>
  );
}
