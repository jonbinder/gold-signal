export function SegmentLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="mx-auto min-h-[240px] max-w-6xl px-4 py-12 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="skeleton mb-6 h-1 w-full max-w-xs rounded-sm" />
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <div className="mt-6 grid gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton h-14 rounded-sm"
            style={{ opacity: 0.95 - i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
