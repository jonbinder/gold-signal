import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvestorBySlug, getInvestors, investorInitials } from "@/lib/goldsignal/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getInvestors().map((inv) => ({ slug: inv.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const investor = getInvestorBySlug(slug);
  return {
    title: investor ? `${investor.name} — GoldSignal.ai` : "Investor — GoldSignal.ai",
  };
}

export default async function InvestorDetailPage({ params }: Props) {
  const { slug } = await params;
  const investor = getInvestorBySlug(slug);
  if (!investor) notFound();

  return (
    <main>
      <section className="investor-detail">
        <header className="section-header">
          <p className="section-header__eyebrow mono">
            <Link href="/investors">← All investors</Link>
          </p>
          <div className="investor-detail__header">
            <div className="investor-card__avatar investor-card__avatar--lg mono" aria-hidden="true">
              {investorInitials(investor.name)}
            </div>
            <div>
              <h1 className="section-header__title">{investor.name}</h1>
              <p className="investor-card__role">{investor.role}</p>
              {investor.aum ? <p className="investor-detail__aum mono">{investor.aum} est. AUM</p> : null}
            </div>
          </div>
          {investor.bio ? <p className="section-header__sub">{investor.bio}</p> : null}
          {investor.thesis ? <p className="investor-detail__thesis">{investor.thesis}</p> : null}
        </header>

        <div className="rankings__table-wrap">
          <table className="rankings-table investor-holdings-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Company</th>
                <th scope="col">Ticker</th>
                <th scope="col">Est. weight</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {investor.holdings.map((row) => (
                <tr key={`${row.rank}-${row.company}`}>
                  <td className="mono">{row.rank}</td>
                  <td>{row.company}</td>
                  <td className="mono rankings-table__ticker">{row.ticker || "—"}</td>
                  <td className="mono">{row.weight != null ? `${row.weight}%` : "—"}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
