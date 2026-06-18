export type HomePopularInvestorRow = {
  slug: string;
  name: string;
  firm: string;
  bioShort: string;
  photoUrl: string | null;
  stockCount: number;
  lastUpdatedAt: string;
};

export type HomeInsiderRow = {
  id: string;
  ticker: string;
  companyName: string;
  type: "BUY" | "SELL";
  dateIso: string;
  dateLabel: string;
  insiderLabel: string;
  role: string;
  sizeLabel: string;
};

export type HomeMostHeldRow = {
  ticker: string;
  companyName: string;
  holderCount: number;
  logoUrl: string;
  subCategory: string;
};

export type HomeBiggestPositionRow = {
  investorSlug: string;
  investorName: string;
  ticker: string;
  companyName: string;
  sizeLabel: string;
};

export type HomeRecentInvestorRow = {
  slug: string;
  name: string;
  subtitle: string;
  updatedLabel: string;
};

export type HomeDashboardModel = {
  popularPortfolios: HomePopularInvestorRow[];
  mostHeld: HomeMostHeldRow[];
  panels: {
    popularPortfolios: boolean;
    mostHeld: boolean;
  };
};
