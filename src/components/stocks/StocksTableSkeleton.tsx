export function StocksTableSkeleton() {
  return (
    <div className="stocks-table-skeleton" aria-busy="true" aria-label="Loading stocks">
      <div className="stocks-table-skeleton__toolbar skeleton" />
      <div className="stocks-table-skeleton__head">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="stocks-table-skeleton__th skeleton" />
        ))}
      </div>
      {Array.from({ length: 12 }, (_, row) => (
        <div key={row} className="stocks-table-skeleton__row">
          {Array.from({ length: 5 }, (_, col) => (
            <div
              key={col}
              className="stocks-table-skeleton__cell skeleton"
              style={{ opacity: 1 - row * 0.04 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
