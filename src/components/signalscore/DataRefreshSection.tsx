const REFRESH_ROWS = [
  { component: "Institutional 13F Data", cadence: "Quarterly, within 2 days of SEC filing deadline" },
  { component: "Insider Buying vs Selling", cadence: "Within 48 hours of Form 4 SEC filing" },
  { component: "PE Ratio Analysis", cadence: "Weekly, based on latest reported earnings" },
  { component: "Forward PE Projection", cadence: "Weekly, synced to analyst estimate revisions" },
  { component: "Famous Investor Portfolio Tracking", cadence: "Quarterly, upon 13F publication" },
  { component: "52-Week Support Level", cadence: "Daily, based on closing price" },
  { component: "Gold Price Correlation", cadence: "Daily, recalculates on market close" },
  { component: "Analyst Price Target Upside", cadence: "Weekly, as price targets are revised" },
  {
    component: "Executive Commentary Signal",
    cadence: "Within 72 hours of earnings call or investor day transcript",
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
