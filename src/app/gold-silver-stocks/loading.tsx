export default function GoldSilverStocksLoading() {
  return (
    <div className="min-h-screen bg-[#060d16] px-4 py-16 text-slate-400 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="skeleton h-8 w-64 rounded-sm bg-white/10" />
        <div className="skeleton h-4 w-full max-w-xl rounded-sm bg-white/10" />
        <div className="skeleton mt-10 h-40 w-full rounded-sm bg-white/10" />
      </div>
    </div>
  );
}
