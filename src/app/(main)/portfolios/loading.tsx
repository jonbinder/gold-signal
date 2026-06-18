import { InvestorsGridSkeleton } from "@/components/investors/InvestorsGridSkeleton";

export default function InvestorsLoading() {
  return (
    <main className="funds-page">
      <header className="funds-hero funds-hero--investors">
        <div className="funds-hero__inner">
          <div className="skeleton" style={{ height: 28, width: "min(420px, 90%)", marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 16, width: "min(520px, 95%)" }} />
        </div>
      </header>
      <div className="funds-main funds-main--investors">
        <InvestorsGridSkeleton />
      </div>
    </main>
  );
}
