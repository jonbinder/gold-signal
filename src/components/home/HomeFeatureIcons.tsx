import { BarChart3, PieChart, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, label: "Track Top Investors" },
  { icon: BarChart3, label: "Real-Time Portfolio Data" },
  { icon: PieChart, label: "Actionable Insights" },
] as const;

export function HomeFeatureIcons() {
  return (
    <ul className="grid grid-cols-3 gap-3 border-y border-[var(--border)] py-6 sm:gap-4 md:hidden">
      {FEATURES.map(({ icon: Icon, label }) => (
        <li key={label} className="flex flex-col items-center gap-2.5 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-[var(--gold)]/60 text-[var(--gold)]">
            <Icon className="size-5 stroke-[1.5]" aria-hidden />
          </span>
          <span className="text-[9px] font-bold uppercase leading-tight tracking-[0.08em] text-white sm:text-[10px]">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
