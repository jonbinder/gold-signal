import type { Investor, InvestorHolding } from "@/lib/goldsignal/data";
import { getInvestorBySlug, getInvestors } from "@/lib/goldsignal/data";
import { investorImages } from "@/lib/investor-images";
import { INVESTOR_PROFILES } from "@/lib/investor-profiles";
import { getEnrichmentForTicker } from "@/lib/stocks-data";
import { normalizeClientLogoUrl } from "@/lib/stock-branding";

export type EnrichedHolding = {
  ticker: string;
  company: string;
  estWeight: string;
  notes: string;
  marketCap: number | null;
  priceHistory: number[];
  logoUrl: string;
};

export type InvestorProfile = {
  slug: string;
  displayName: string;
  role: string;
  firm: string;
  website: string;
  bio: string;
  aum: string;
  thesis: string;
  photoUrl: string;
  holdings: EnrichedHolding[];
};

function displayName(investor: Investor): string {
  const dash = investor.name.indexOf(" – ");
  if (dash > 0) return investor.name.slice(0, dash).trim();
  return investor.sheetName.trim() || investor.name;
}

function enrichHolding(holding: InvestorHolding): EnrichedHolding {
  const ticker = holding.ticker.trim().toUpperCase();
  const enrichment = ticker ? getEnrichmentForTicker(ticker) : null;

  return {
    ticker: ticker || "—",
    company: holding.company,
    estWeight: holding.weight != null ? `${holding.weight}%` : "—",
    notes: holding.notes,
    marketCap: enrichment?.marketCap ?? null,
    priceHistory: enrichment?.priceHistory ?? [],
    logoUrl:
      normalizeClientLogoUrl(enrichment?.logoUrl ?? null, ticker) ?? "",
  };
}

export function buildInvestorProfile(investor: Investor): InvestorProfile {
  const meta = INVESTOR_PROFILES[investor.slug];
  const photoUrl = investorImages[investor.slug] ?? "";

  return {
    slug: investor.slug,
    displayName: displayName(investor),
    role: investor.role,
    firm: meta?.firm ?? investor.role,
    website: meta?.website ?? "",
    bio: meta?.bio ?? investor.bio,
    aum: investor.aum,
    thesis: investor.thesis,
    photoUrl,
    holdings: investor.holdings.map(enrichHolding),
  };
}

export function getInvestorProfileBySlug(slug: string): InvestorProfile | undefined {
  const investor = getInvestorBySlug(slug);
  if (!investor) return undefined;
  return buildInvestorProfile(investor);
}

export { getInvestors };
