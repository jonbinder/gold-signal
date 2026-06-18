"use client";

export default function PortfoliosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="funds-page">
      <div className="funds-main funds-main--investors">
        <div className="investors-empty" role="alert">
          <h2 className="investors-empty__title">Could not load portfolios</h2>
          <p className="investors-empty__body">
            {error.message || "The portfolio list failed to load from Supabase."} Try again — if this
            persists, check your Supabase connection and that migration 024 has been applied.
          </p>
          <button type="button" className="btn btn--cta" style={{ marginTop: "1rem" }} onClick={reset}>
            Retry
          </button>
        </div>
      </div>
    </main>
  );
}
