import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getInvestorBySlug } from "@/lib/investors";
import { InvestorImage } from "@/components/investors/InvestorImage";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fallbackTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const investor = await getInvestorBySlug(slug);
  return { title: investor?.name ?? fallbackTitle };
}

function websiteDisplay(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function formatPct(pct: number): string {
  const n = Math.round(pct);
  return `${n}%`;
}

export default async function InvestorPage({ params }: Props) {
  const { slug } = await params;
  const investor = await getInvestorBySlug(slug);
  if (!investor) notFound();

  const holdings = [...investor.portfolio].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/investors"
            className="inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-gold-600"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Investors
          </Link>

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
            <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-sm border-2 border-navy-200 bg-navy-100 shadow-sm md:mx-0 md:h-44 md:w-44">
              <InvestorImage
                src={investor.imageSrc}
                alt={`${investor.name} photo`}
                width={176}
                height={176}
                className="h-full w-full object-cover object-top"
                sizes="(max-width: 768px) 160px, 176px"
                priority
              />
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{investor.name}</h1>
              <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-navy-900 sm:text-sm">
                {investor.title}
              </p>
              {investor.website ? (
                <a
                  href={investor.website.startsWith("http") ? investor.website : `https://${investor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:text-blue-700"
                >
                  {websiteDisplay(investor.website)}
                </a>
              ) : null}
              <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base md:mx-0 md:mr-auto">
                {investor.description}
              </p>
              {investor.lastUpdated ? (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Last updated {investor.lastUpdated}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="gs-table min-w-[560px]">
              <thead>
                <tr>
                  <th className="text-right">% Portfolio</th>
                  <th>Ticker</th>
                  <th>Company name</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={`${h.ticker}-${h.company}`}>
                    <td className="text-right font-mono text-sm font-semibold text-navy-900">{formatPct(h.percentage)}</td>
                    <td>
                      <span className="font-mono text-sm font-bold tracking-wide text-gold-700">{h.ticker}</span>
                    </td>
                    <td>
                      <Link
                        href={`/stocks/${h.ticker}`}
                        className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:text-blue-700"
                      >
                        {h.company}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {holdings.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">No holdings for this profile yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
