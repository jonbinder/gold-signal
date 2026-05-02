import type { HoldingWithSecurity, Investor } from "@/types";

/** Fallback investors — mirrors migration seed names/slugs */
export const SEED_INVESTORS: Investor[] = [
  {
    id: "seed-sprott",
    slug: "sprott-asset-management",
    name: "Sprott Asset Management",
    firm: "Sprott Inc.",
    bio: "World's largest dedicated precious metals manager.",
    aum_usd: 25_000_000_000,
    focus: ["gold", "silver", "royalties"],
    is_active: true,
    logo_url: null,
    website_url: "https://sprott.com",
    created_at: "",
    updated_at: "",
  },
  {
    id: "seed-first-eagle",
    slug: "first-eagle-investments",
    name: "First Eagle Investment Management",
    firm: "First Eagle",
    bio: "Value-oriented manager with significant gold holdings.",
    aum_usd: 105_000_000_000,
    focus: ["gold", "value"],
    is_active: true,
    logo_url: null,
    website_url: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "seed-vaneck",
    slug: "van-eck-associates",
    name: "VanEck Associates",
    firm: "VanEck",
    bio: "Pioneer in gold mining equity ETFs.",
    aum_usd: 80_000_000_000,
    focus: ["gold", "silver", "etf"],
    is_active: true,
    logo_url: null,
    website_url: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "seed-tocqueville",
    slug: "tocqueville-asset-management",
    name: "Tocqueville Asset Management",
    firm: "Tocqueville",
    bio: "Home of the long-running Tocqueville Gold Fund.",
    aum_usd: 8_000_000_000,
    focus: ["gold", "silver"],
    is_active: true,
    logo_url: null,
    website_url: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "seed-baker",
    slug: "baker-steel-capital",
    name: "Baker Steel Capital Managers",
    firm: "Baker Steel",
    bio: "London-based specialist in precious metals equities.",
    aum_usd: 2_000_000_000,
    focus: ["gold", "silver", "platinum"],
    is_active: true,
    logo_url: null,
    website_url: null,
    created_at: "",
    updated_at: "",
  },
];

const mkSecurity = (
  id: string,
  ticker: string,
  exchange: string,
  name: string,
  sector: HoldingWithSecurity["security"]["sector"],
  sub_sector: string,
  country: string,
  market_cap: number | null
): HoldingWithSecurity["security"] => ({
  id,
  ticker,
  exchange,
  name,
  sector,
  sub_sector,
  country,
  market_cap,
  logo_url: null,
  is_active: true,
  created_at: "",
});

function mkHolding(
  investorId: string,
  hId: string,
  sec: HoldingWithSecurity["security"],
  opts: {
    shares: number;
    value_usd: number;
    portfolio_pct: number;
    shares_prev?: number | null;
    value_prev_usd?: number | null;
    change_type: HoldingWithSecurity["change_type"];
    change_pct?: number | null;
  }
): HoldingWithSecurity {
  return {
    id: hId,
    investor_id: investorId,
    security_id: sec.id,
    period_id: "seed-period",
    shares: opts.shares,
    value_usd: opts.value_usd,
    portfolio_pct: opts.portfolio_pct,
    shares_prev: opts.shares_prev ?? null,
    value_prev_usd: opts.value_prev_usd ?? null,
    change_type: opts.change_type,
    change_pct: opts.change_pct ?? null,
    created_at: "",
    security: sec,
  };
}

const S = {
  WPM: mkSecurity("s-wpm", "WPM", "NYSE", "Wheaton Precious Metals", "Royalty/Streaming", "Streaming", "Canada", 24e9),
  AEM: mkSecurity("s-aem", "AEM", "NYSE", "Agnico Eagle Mines", "Gold Miner", "Senior Producer", "Canada", 44e9),
  GDX: mkSecurity("s-gdx", "GDX", "NYSEARCA", "VanEck Gold Miners ETF", "ETF", "Senior ETF", "USA", null),
  GDXJ: mkSecurity("s-gdxj", "GDXJ", "NYSEARCA", "VanEck Junior Gold Miners ETF", "ETF", "Junior ETF", "USA", null),
  FNV: mkSecurity("s-fnv", "FNV", "NYSE", "Franco-Nevada Corporation", "Royalty/Streaming", "Royalty", "Canada", 28e9),
  NEM: mkSecurity("s-nem", "NEM", "NYSE", "Newmont Corporation", "Gold Miner", "Senior Producer", "USA", 52e9),
  GOLD: mkSecurity("s-gold", "GOLD", "NYSE", "Barrick Gold Corporation", "Gold Miner", "Senior Producer", "Canada", 36e9),
  PAAS: mkSecurity("s-paas", "PAAS", "NASDAQ", "Pan American Silver Corp", "Silver Miner", "Senior Producer", "Canada", 7e9),
  AG: mkSecurity("s-ag", "AG", "NYSE", "First Majestic Silver", "Silver Miner", "Mid-Tier", "Canada", 4e9),
  SIL: mkSecurity("s-sil", "SIL", "NYSEARCA", "Global X Silver Miners ETF", "ETF", "Silver ETF", "USA", null),
};

/** Offline holdings per slug — UI preview before Supabase */
export const SEED_HOLDINGS_BY_SLUG: Record<string, HoldingWithSecurity[]> = {
  "sprott-asset-management": [
    mkHolding("seed-sprott", "h-s1", S.WPM, {
      shares: 5_000_000,
      value_usd: 220_000_000,
      portfolio_pct: 18.5,
      shares_prev: 4_500_000,
      value_prev_usd: 190_000_000,
      change_type: "add",
      change_pct: 11.1,
    }),
    mkHolding("seed-sprott", "h-s2", S.AEM, {
      shares: 3_200_000,
      value_usd: 185_000_000,
      portfolio_pct: 15.6,
      shares_prev: 3_200_000,
      value_prev_usd: 172_000_000,
      change_type: "unchanged",
      change_pct: 0,
    }),
    mkHolding("seed-sprott", "h-s3", S.GDX, {
      shares: 8_100_000,
      value_usd: 140_000_000,
      portfolio_pct: 11.8,
      shares_prev: null,
      value_prev_usd: null,
      change_type: "new",
      change_pct: null,
    }),
    mkHolding("seed-sprott", "h-s4", S.FNV, {
      shares: 2_400_000,
      value_usd: 108_000_000,
      portfolio_pct: 9.1,
      shares_prev: 3_000_000,
      value_prev_usd: 130_000_000,
      change_type: "reduce",
      change_pct: -20,
    }),
  ],
  "first-eagle-investments": [
    mkHolding("seed-first-eagle", "h-fe1", S.NEM, {
      shares: 6_400_000,
      value_usd: 268_800_000,
      portfolio_pct: 14.2,
      change_type: "unchanged",
      change_pct: 0,
    }),
    mkHolding("seed-first-eagle", "h-fe2", S.GOLD, {
      shares: 12_000_000,
      value_usd: 216_000_000,
      portfolio_pct: 11.4,
      shares_prev: 10_000_000,
      value_prev_usd: 175_000_000,
      change_type: "add",
      change_pct: 20,
    }),
    mkHolding("seed-first-eagle", "h-fe3", S.FNV, {
      shares: 1_800_000,
      value_usd: 162_000_000,
      portfolio_pct: 8.6,
      shares_prev: 2_500_000,
      value_prev_usd: 205_000_000,
      change_type: "reduce",
      change_pct: -28,
    }),
    mkHolding("seed-first-eagle", "h-fe4", S.WPM, {
      shares: 2_100_000,
      value_usd: 92_400_000,
      portfolio_pct: 4.9,
      shares_prev: null,
      value_prev_usd: null,
      change_type: "new",
      change_pct: null,
    }),
  ],
  "van-eck-associates": [
    mkHolding("seed-vaneck", "h-ve1", S.GDX, {
      shares: 42_000_000,
      value_usd: 910_000_000,
      portfolio_pct: 28.5,
      change_type: "add",
      change_pct: 5,
    }),
    mkHolding("seed-vaneck", "h-ve2", S.GDXJ, {
      shares: 18_500_000,
      value_usd: 462_500_000,
      portfolio_pct: 14.5,
      change_type: "unchanged",
      change_pct: 0,
    }),
    mkHolding("seed-vaneck", "h-ve3", S.AEM, {
      shares: 4_100_000,
      value_usd: 237_800_000,
      portfolio_pct: 7.4,
      shares_prev: 5_000_000,
      value_prev_usd: 275_000_000,
      change_type: "reduce",
      change_pct: -18,
    }),
    mkHolding("seed-vaneck", "h-ve4", S.SIL, {
      shares: 9_800_000,
      value_usd: 156_800_000,
      portfolio_pct: 4.9,
      shares_prev: null,
      value_prev_usd: null,
      change_type: "new",
      change_pct: null,
    }),
  ],
  "tocqueville-asset-management": [
    mkHolding("seed-tocqueville", "h-tq1", S.PAAS, {
      shares: 5_500_000,
      value_usd: 143_000_000,
      portfolio_pct: 16.2,
      change_type: "unchanged",
      change_pct: 0,
    }),
    mkHolding("seed-tocqueville", "h-tq2", S.WPM, {
      shares: 2_900_000,
      value_usd: 127_600_000,
      portfolio_pct: 14.5,
      shares_prev: 3_400_000,
      value_prev_usd: 142_800_000,
      change_type: "reduce",
      change_pct: -15,
    }),
    mkHolding("seed-tocqueville", "h-tq3", S.GDX, {
      shares: 6_200_000,
      value_usd: 134_320_000,
      portfolio_pct: 15.2,
      change_type: "add",
      change_pct: 8,
    }),
    mkHolding("seed-tocqueville", "h-tq4", S.AEM, {
      shares: 1_600_000,
      value_usd: 92_800_000,
      portfolio_pct: 10.5,
      shares_prev: null,
      value_prev_usd: null,
      change_type: "new",
      change_pct: null,
    }),
  ],
  "baker-steel-capital": [
    mkHolding("seed-baker", "h-bk1", S.AG, {
      shares: 8_800_000,
      value_usd: 114_400_000,
      portfolio_pct: 18.8,
      change_type: "add",
      change_pct: 12,
    }),
    mkHolding("seed-baker", "h-bk2", S.GDXJ, {
      shares: 5_400_000,
      value_usd: 135_000_000,
      portfolio_pct: 22.2,
      shares_prev: 6_000_000,
      value_prev_usd: 138_000_000,
      change_type: "reduce",
      change_pct: -10,
    }),
    mkHolding("seed-baker", "h-bk3", S.GOLD, {
      shares: 4_200_000,
      value_usd: 75_600_000,
      portfolio_pct: 12.4,
      change_type: "unchanged",
      change_pct: 0,
    }),
    mkHolding("seed-baker", "h-bk4", S.PAAS, {
      shares: 3_100_000,
      value_usd: 80_600_000,
      portfolio_pct: 13.2,
      shares_prev: 4_000_000,
      value_prev_usd: 96_000_000,
      change_type: "reduce",
      change_pct: -22.5,
    }),
  ],
};

export function getSeedInvestorBySlug(slug: string): Investor | null {
  return SEED_INVESTORS.find((i) => i.slug === slug) ?? null;
}

export function getSeedHoldingsForSlug(slug: string): HoldingWithSecurity[] {
  return SEED_HOLDINGS_BY_SLUG[slug] ?? [];
}
