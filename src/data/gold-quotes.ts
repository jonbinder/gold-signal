/**
 * Curated gold quotes — positive attributions on gold's role, history, and value.
 * Add entries to GOLD_QUOTES; each needs a unique `id`.
 */
export type GoldQuote = {
  id: string;
  text: string;
  author: string;
  source?: string;
};

export const GOLD_QUOTES: readonly GoldQuote[] = [
  {
    id: "dalio-history",
    text: "If you don't own gold, you know neither history nor economics.",
    author: "Ray Dalio",
    source: "Founder, Bridgewater Associates",
  },
  {
    id: "dalio-hold",
    text: "Gold is the only asset that somebody can hold and you don't have to depend on somebody else to pay you money for.",
    author: "Ray Dalio",
    source: "Bridgewater Associates (TIME, CNBC, 2025)",
  },
  {
    id: "dalio-money",
    text: "Gold is a money and it is the money that is least at risk of being devalued and/or confiscated.",
    author: "Ray Dalio",
    source: "Bridgewater Associates (TIME, CNBC, 2025)",
  },
  {
    id: "dalio-track-record",
    text: "Gold has the best track record of having its value track the cost of living over very long periods of time.",
    author: "Ray Dalio",
    source: "Bridgewater Associates (TIME, CNBC, 2025)",
  },
  {
    id: "morgan-1912",
    text: "Gold is money. Everything else is credit.",
    author: "J.P. Morgan",
    source: "Testimony to Congress, 1912",
  },
  {
    id: "greenspan-1999",
    text: "Gold still represents the ultimate form of payment in the world.",
    author: "Alan Greenspan",
    source: "Congressional testimony, 1999",
  },
  {
    id: "greenspan-1966",
    text: "In the absence of the gold standard, there is no way to protect savings from confiscation through inflation.",
    author: "Alan Greenspan",
    source: "\"Gold and Economic Freedom,\" 1966",
  },
  {
    id: "maloney-store",
    text: "Gold is still the ultimate store of wealth. It's the world's only true money. And there isn't much of it to go around.",
    author: "Mike Maloney",
    source: "Sound-money educator",
  },
  {
    id: "baruch-two-thousand",
    text: "Gold has worked down from Alexander's time. When something holds good for two thousand years, I do not believe it can be so because of prejudice or mistaken theory.",
    author: "Bernard Baruch",
    source: "Financier",
  },
  {
    id: "emerson-freedom",
    text: "The desire of gold is not for gold. It is for the means of freedom and benefit.",
    author: "Ralph Waldo Emerson",
  },
  {
    id: "hayek-governments",
    text: "With the exception only of the period of the gold standard, practically all governments of history have used their exclusive power to issue money to defraud and plunder the people.",
    author: "Friedrich A. von Hayek",
    source: "Economist",
  },
  {
    id: "gibson-storms",
    text: "It is extraordinary how many emotional storms one may weather in safety if one is ballasted with ever so little gold.",
    author: "William Gibson",
  },
  {
    id: "franz-hierarchy",
    text: "Gold is the money of kings; silver is the money of gentlemen; barter is the money of peasants; but debt is the money of slaves.",
    author: "Norm Franz",
    source: "Widely attributed",
  },
  {
    id: "machiavelli-soldiers",
    text: "Gold will not always get you good soldiers, but good soldiers can get you gold.",
    author: "Niccolò Machiavelli",
  },
  {
    id: "frbny-history",
    text: "For centuries, gold had a profound impact on history, as a symbol and a storehouse of wealth accepted universally around the world.",
    author: "Federal Reserve Bank of New York",
  },
  {
    id: "frbny-worried",
    text: "When people are worried about political instability, war or inflation, they often put their savings into gold.",
    author: "Federal Reserve Bank of New York",
  },
  {
    id: "marx-nature",
    text: "Although gold and silver are not by nature money, money is by nature gold and silver.",
    author: "Karl Marx",
  },
] as const;

export const GOLD_QUOTE_COUNT = GOLD_QUOTES.length;

/** Pick one quote at random; optionally exclude the current id (for "another"). */
export function pickRandomGoldQuote(excludeId?: string): GoldQuote {
  const pool =
    excludeId && GOLD_QUOTES.length > 1
      ? GOLD_QUOTES.filter((q) => q.id !== excludeId)
      : GOLD_QUOTES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? GOLD_QUOTES[0];
}
