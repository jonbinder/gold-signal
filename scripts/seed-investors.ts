import "dotenv/config";
import { getSupabaseServiceRole } from "@/lib/supabase/service-role";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

type InvestorSeed = {
  slug: string;
  name: string;
  type: "individual" | "fund";
  titleRole: string;
  bio: string;
  website: string | null;
  cik: string | null;
  focusNote: string;
  sortOrder: number;
  positions: PositionSeed[];
};

type PositionSeed = {
  ticker: string;
  companyName: string;
  positionType: "stake_filing" | "insider_form4" | "fund_13f" | "public_statement" | "other_disclosure";
  detail: string;
  approxSize: string | null;
  sourceType: string;
  sourceDetail: string;
  asOfDate: string;
  whyInteresting: string | null;
};

const DEFAULT_SOURCE_FORM4 = "SEC Form 4 / public disclosure";
const DEFAULT_SOURCE_RICK = "Public statement / conference";

const INVESTOR_SEEDS: InvestorSeed[] = [
  {
    slug: "sprott-inc",
    name: "Sprott Inc.",
    type: "fund",
    titleRole: "Precious-metals focused asset manager",
    bio: "Eric Sprott's firm; major precious-metals focused manager with dedicated real-asset strategies.",
    website: "https://sprott.com",
    cik: "0001512920",
    focusNote: "Precious-metals focused asset manager (Eric Sprott's firm)",
    sortOrder: 10,
    positions: [],
  },
  {
    slug: "asa-gold-precious-metals-limited",
    name: "ASA Gold and Precious Metals Limited",
    type: "fund",
    titleRole: "Dedicated gold & precious-metals closed-end fund",
    bio: "Long-running closed-end fund focused on gold and precious-metals equities.",
    website: "https://www.asaltd.com",
    cik: "0001230869",
    focusNote: "Dedicated gold & precious-metals closed-end fund",
    sortOrder: 20,
    positions: [],
  },
  {
    slug: "eric-sprott",
    name: "Eric Sprott",
    type: "individual",
    titleRole: "Legendary precious-metals investor; founder of Sprott Inc.",
    bio: "Known for concentrated precious-metals investments and frequent public disclosure activity in Canadian juniors.",
    website: null,
    cik: null,
    focusNote: "Files Form 4 insider reports on many Canadian juniors.",
    sortOrder: 30,
    positions: [
      {
        ticker: "DSV",
        companyName: "Discovery Silver",
        positionType: "other_disclosure",
        detail: "Large reported holding (~22% of tracked equity holdings)",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure compilation (research draft) — verify exact filing chain before publish",
        asOfDate: "2025-10-20",
        whyInteresting: "Represents major concentration in a silver-focused name.",
      },
      {
        ticker: "SLVR",
        companyName: "Silverco Mining",
        positionType: "stake_filing",
        detail: "14.2% stake, 4,637,960 shares (~$7.4M)",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure (2025-10-17) — verify filing document URL before publish",
        asOfDate: "2025-10-17",
        whyInteresting: "Material ownership level in a silver junior.",
      },
      {
        ticker: "JAG",
        companyName: "Jaguar Mining",
        positionType: "other_disclosure",
        detail: "Disclosed holding",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure aggregation — verify source filing before publish",
        asOfDate: "2025-10-20",
        whyInteresting: null,
      },
      {
        ticker: "TUD",
        companyName: "Tudor Gold",
        positionType: "other_disclosure",
        detail: "Disclosed holding",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure aggregation — verify source filing before publish",
        asOfDate: "2025-10-20",
        whyInteresting: null,
      },
      {
        ticker: "NFG",
        companyName: "New Found Gold",
        positionType: "other_disclosure",
        detail: "Disclosed holding",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure aggregation — verify source filing before publish",
        asOfDate: "2025-10-20",
        whyInteresting: null,
      },
      {
        ticker: "KTN",
        companyName: "Kootenay Silver",
        positionType: "other_disclosure",
        detail: "Disclosed silver-junior holding",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure aggregation — verify source filing before publish",
        asOfDate: "2025-10-20",
        whyInteresting: null,
      },
      {
        ticker: "BRC",
        companyName: "Blackrock Silver",
        positionType: "other_disclosure",
        detail: "Disclosed silver-junior holding",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure aggregation — verify source filing before publish",
        asOfDate: "2025-10-20",
        whyInteresting: null,
      },
      {
        ticker: "AAG",
        companyName: "Aftermath Silver",
        positionType: "other_disclosure",
        detail: "Disclosed silver-junior holding",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_FORM4,
        sourceDetail: "Public disclosure aggregation — verify source filing before publish",
        asOfDate: "2025-10-20",
        whyInteresting: null,
      },
    ],
  },
  {
    slug: "rick-rule",
    name: "Rick Rule",
    type: "individual",
    titleRole: "Proprietor, Rule Investment Media; former CEO Sprott U.S. Holdings",
    bio: "Natural-resources investor known for conference commentary and long-form sector interviews.",
    website: null,
    cik: null,
    focusNote: "Names positions publicly at conferences and in interviews.",
    sortOrder: 40,
    positions: [
      {
        ticker: "RGLD",
        companyName: "Royal Gold",
        positionType: "public_statement",
        detail: "Named holding (Rule Symposium / VRIC)",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_RICK,
        sourceDetail: "VRIC / Rule Symposium references (research draft) — add exact clip URL before publish",
        asOfDate: "2026-01-15",
        whyInteresting: "Blue-chip royalty name repeatedly cited in resource-focused discussions.",
      },
      {
        ticker: "MUX",
        companyName: "McEwen Mining",
        positionType: "public_statement",
        detail: "Named holding (interview, Dec 2025)",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_RICK,
        sourceDetail: "Interview mention (Dec 2025) — verify exact outlet URL before publish",
        asOfDate: "2025-12-17",
        whyInteresting: null,
      },
      {
        ticker: "GLDG",
        companyName: "GoldMining Inc.",
        positionType: "public_statement",
        detail: "Named holding (interview, Dec 2025)",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_RICK,
        sourceDetail: "Interview mention (Dec 2025) — verify exact outlet URL before publish",
        asOfDate: "2025-12-17",
        whyInteresting: null,
      },
      {
        ticker: "PAAS",
        companyName: "Pan American Silver",
        positionType: "public_statement",
        detail: "Named as silver reinvestment (VRIC 2026)",
        approxSize: null,
        sourceType: DEFAULT_SOURCE_RICK,
        sourceDetail: "VRIC 2026 statement (research draft) — add exact session URL before publish",
        asOfDate: "2026-01-15",
        whyInteresting: null,
      },
    ],
  },
  {
    slug: "frank-giustra",
    name: "Frank Giustra",
    type: "individual",
    titleRole: "Founder & CEO, Fiore Group; serial mining-company builder",
    bio: "Resource investor and company builder tracked through founded/chair-related mining companies.",
    website: "https://www.fioregroup.com",
    cik: null,
    focusNote: "Tracked by companies he founded/chairs.",
    sortOrder: 50,
    positions: [
      {
        ticker: "WRLG",
        companyName: "West Red Lake Gold",
        positionType: "other_disclosure",
        detail: "Backs/chairs",
        approxSize: null,
        sourceType: "Company filings / public record",
        sourceDetail: "Fiore Group / company disclosures (research draft) — verify primary source URL before publish",
        asOfDate: "2026-01-01",
        whyInteresting: null,
      },
      {
        ticker: "EQX",
        companyName: "Equinox Gold",
        positionType: "other_disclosure",
        detail: "Via Leagold merger (former chairman). Also associated in public records with Nations Royalty Corp. and Nexgold (no clean ticker linkage yet).",
        approxSize: null,
        sourceType: "Company filings / public record",
        sourceDetail: "Fiore Group / company disclosures (research draft) — verify primary source URL before publish",
        asOfDate: "2026-01-01",
        whyInteresting: null,
      },
    ],
  },
  {
    slug: "peter-schiff",
    name: "Peter Schiff",
    type: "individual",
    titleRole: "CEO, Euro Pacific Asset Management; gold advocate",
    bio: "Macro commentator and gold advocate; positions should only be added from explicit sourced statements.",
    website: "https://www.europac.com",
    cik: null,
    focusNote:
      "Primarily macro/gold advocacy; add positions only from explicit public statements (do not infer holdings).",
    sortOrder: 60,
    positions: [],
  },
  {
    slug: "adrian-day",
    name: "Adrian Day",
    type: "individual",
    titleRole: "Resource investor / newsletter author",
    bio: "Resource-focused investor and publisher.",
    website: "https://www.adriandayassetmanagement.com",
    cik: null,
    focusNote: "Track as individual via sourced statements; not auto-13F.",
    sortOrder: 70,
    positions: [],
  },
  {
    slug: "doug-casey",
    name: "Doug Casey",
    type: "individual",
    titleRole: "Resource investor and author",
    bio: "Long-time resource investor and commentator.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions via interviews/public disclosures.",
    sortOrder: 80,
    positions: [],
  },
  {
    slug: "marin-katusa",
    name: "Marin Katusa",
    type: "individual",
    titleRole: "Founder, Katusa Research",
    bio: "Natural-resource focused analyst and investor.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions from explicit disclosures/statements.",
    sortOrder: 90,
    positions: [],
  },
  {
    slug: "lawrence-lepard",
    name: "Lawrence Lepard",
    type: "individual",
    titleRole: "Founder, Equity Management Associates",
    bio: "Macro investor with public precious-metals commentary.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions from explicit statements.",
    sortOrder: 100,
    positions: [],
  },
  {
    slug: "lobo-tiggre",
    name: "Lobo Tiggre",
    type: "individual",
    titleRole: "The Independent Speculator",
    bio: "Resource-sector analyst and commentator.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions from explicit disclosures/statements.",
    sortOrder: 110,
    positions: [],
  },
  {
    slug: "john-hathaway",
    name: "John Hathaway",
    type: "individual",
    titleRole: "Gold-focused portfolio manager",
    bio: "Long-time gold-focused portfolio manager and commentator.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions from explicit disclosures/statements.",
    sortOrder: 120,
    positions: [],
  },
  {
    slug: "robert-friedland",
    name: "Robert Friedland",
    type: "individual",
    titleRole: "Mining entrepreneur and financier",
    bio: "Mining entrepreneur known for major resource ventures.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions via company filings/public disclosures.",
    sortOrder: 130,
    positions: [],
  },
  {
    slug: "ross-beaty",
    name: "Ross Beaty",
    type: "individual",
    titleRole: "Mining entrepreneur and investor",
    bio: "Resource entrepreneur with long history in mining investments.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions via filings/public records.",
    sortOrder: 140,
    positions: [],
  },
  {
    slug: "rob-mcewen",
    name: "Rob McEwen",
    type: "individual",
    titleRole: "Founder/Chairman, McEwen Mining",
    bio: "Precious-metals executive and investor.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions via filings/public records.",
    sortOrder: 150,
    positions: [],
  },
  {
    slug: "pierre-lassonde",
    name: "Pierre Lassonde",
    type: "individual",
    titleRole: "Franco-Nevada co-founder",
    bio: "Mining/royalty sector veteran and investor.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions via explicit disclosures/statements.",
    sortOrder: 160,
    positions: [],
  },
  {
    slug: "lyn-alden",
    name: "Lyn Alden",
    type: "individual",
    titleRole: "Macro strategist and investor",
    bio: "Macro strategist with public precious-metals market commentary.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions only from explicit statements.",
    sortOrder: 170,
    positions: [],
  },
  {
    slug: "luke-gromen",
    name: "Luke Gromen",
    type: "individual",
    titleRole: "Macro strategist, FFTT",
    bio: "Macro strategist with public commodities commentary.",
    website: null,
    cik: null,
    focusNote: "Add sourced notable positions only from explicit statements.",
    sortOrder: 180,
    positions: [],
  },
];

async function ensureReviewColumns() {
  const supabase = getSupabaseServiceRole();
  if (!supabase) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  // no-op probe; migration handles schema. Keep early validation in script output.
  const { error } = await supabase.from("investors").select("id, needs_review").limit(1);
  if (error) {
    throw new Error(
      `investors.needs_review missing or inaccessible. Apply migration 017_investor_needs_review.sql first. (${error.message})`,
    );
  }
}

async function upsertInvestor(seed: InvestorSeed): Promise<string> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const payload = {
    slug: seed.slug,
    name: seed.name,
    investor_type: seed.type,
    title_role: seed.titleRole,
    bio: seed.bio,
    website: seed.website,
    website_url: seed.website,
    cik: seed.cik,
    focus_note: seed.focusNote,
    sort_order: seed.sortOrder,
    is_published: false,
    needs_review: true,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("investors")
    .upsert(payload, { onConflict: "slug" })
    .select("id")
    .single();
  if (error || !data?.id) throw new Error(`upsert investor ${seed.slug} failed: ${error?.message ?? "unknown"}`);
  return data.id as string;
}

async function upsertPosition(investorId: string, row: PositionSeed): Promise<void> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  const ticker = row.ticker.trim().toUpperCase();
  const { data: existing } = await supabase
    .from("investor_positions")
    .select("id")
    .eq("investor_id", investorId)
    .eq("ticker", ticker)
    .eq("source_type", row.sourceType)
    .eq("source_detail", row.sourceDetail)
    .limit(1)
    .maybeSingle();

  const payload = {
    investor_id: investorId,
    ticker,
    company_name: row.companyName,
    position_type: row.positionType,
    detail: row.detail,
    approx_size: row.approxSize,
    source_type: row.sourceType,
    source_detail: row.sourceDetail,
    as_of_date: row.asOfDate,
    why_interesting: row.whyInteresting,
    is_published: false,
    needs_review: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("investor_positions").update(payload).eq("id", existing.id);
    if (error) throw new Error(`update position ${ticker} failed: ${error.message}`);
  } else {
    const { error } = await supabase.from("investor_positions").insert(payload);
    if (error) throw new Error(`insert position ${ticker} failed: ${error.message}`);
  }
}

async function main() {
  await ensureReviewColumns();
  const tracked = new Set(loadTrackedStocksSync().map((s) => s.ticker.toUpperCase()));
  const missingTickers = new Set<string>();

  let investorCount = 0;
  let positionCount = 0;
  for (const investor of INVESTOR_SEEDS) {
    const investorId = await upsertInvestor(investor);
    investorCount += 1;
    for (const pos of investor.positions) {
      await upsertPosition(investorId, pos);
      positionCount += 1;
      if (!tracked.has(pos.ticker.toUpperCase())) missingTickers.add(pos.ticker.toUpperCase());
    }
  }

  console.log(
    `[seed:investors] done: investors upserted=${investorCount}, positions upserted=${positionCount}, all set to draft (is_published=false, needs_review=true)`,
  );
  if (missingTickers.size > 0) {
    console.log(`[seed:investors] tickers without stock pages yet: ${[...missingTickers].sort().join(", ")}`);
  } else {
    console.log("[seed:investors] all seeded tickers have stock pages");
  }
  console.log(
    "[seed:investors] funds seeded as draft records only; run `npm run sync:funds` to auto-populate 13F holdings in investor detail.",
  );
}

main().catch((err) => {
  console.error("[seed:investors] failed:", err);
  process.exit(1);
});
