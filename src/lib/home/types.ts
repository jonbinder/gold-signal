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
  insiderFeed: HomeInsiderRow[];
  insiderFeedNote: string | null;
  mostHeld: HomeMostHeldRow[];
  biggestPositions: HomeBiggestPositionRow[];
  topInsiderBuys: HomeInsiderRow[];
  recentInvestors: HomeRecentInvestorRow[];
  panels: {
    mostHeld: boolean;
    biggestPositions: boolean;
    topInsiderBuys: boolean;
    recentInvestors: boolean;
  };
};
