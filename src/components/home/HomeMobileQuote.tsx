import { Globe, Quote } from "lucide-react";

export function HomeMobileQuote() {
  return (
    <aside className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4 md:hidden">
      <Quote className="mt-0.5 size-8 shrink-0 text-[var(--gold)]" strokeWidth={1.25} aria-hidden />
      <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
        We track the moves of the world&apos;s most successful gold and silver investors — so you can{" "}
        <span className="font-semibold text-[var(--gold)]">invest smarter.</span>
      </p>
      <Globe className="mt-0.5 size-7 shrink-0 text-[var(--gold)]" strokeWidth={1.25} aria-hidden />
    </aside>
  );
}
