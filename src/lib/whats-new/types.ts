export type FeedActivityKind =
  | "insider_buy"
  | "insider_sell"
  | "stake_13d"
  | "stake_13g"
  | "institutional";

export type WhatsNewFeedItem = {
  id: string;
  kind: FeedActivityKind;
  ticker: string;
  companyName: string;
  filingDate: string;
  filingDateLabel: string;
  headline: string;
  subline?: string;
  /** Higher = more notable (for sorting and lead story). */
  significance: number;
  teachingSnippetKey: string;
};

export type WhatsNewFeedSections = {
  insiderBuys: WhatsNewFeedItem[];
  insiderSells: WhatsNewFeedItem[];
  largeStakes: WhatsNewFeedItem[];
  institutional: WhatsNewFeedItem[];
};

export type WhatsNewFeed = {
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  lead: WhatsNewFeedItem | null;
  items: WhatsNewFeedItem[];
  sections: WhatsNewFeedSections;
  usedSampleStakes: boolean;
};
