export type InvestorType = "individual" | "fund";

export type PositionType =
  | "stake_filing"
  | "insider_form4"
  | "fund_13f"
  | "fund_holding"
  | "public_statement"
  | "other_disclosure";

export type InvestorProfile = {
  id: string;
  slug: string;
  name: string;
  type: InvestorType;
  titleRole: string | null;
  bio: string | null;
  photoUrl: string | null;
  website: string | null;
  cik: string | null;
  focusNote: string | null;
  contextNote: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export type InvestorListItem = InvestorProfile & {
  manualPositionCount: number;
  auto13fPositionCount: number;
  positionCount: number;
  updatedAt: string;
};

export type InvestorPosition = {
  id: string;
  investorId: string;
  ticker: string;
  companyName: string;
  positionType: PositionType;
  detail: string;
  approxSize: string | null;
  sourceType: string;
  sourceDetail: string;
  asOfDate: string;
  whyInteresting: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  isAuto13f: boolean;
};

export type InvestorDetailModel = {
  investor: InvestorProfile;
  positions: InvestorPosition[];
  manualPositionCount: number;
  auto13fPositionCount: number;
};
