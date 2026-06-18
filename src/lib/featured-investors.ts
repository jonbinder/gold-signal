/**
 * Curated investor roster for /investors (static).
 * Images live in public/investor-photos/ ({slug}.webp).
 */
export type FeaturedInvestor = {
  slug: string;
  name: string;
  /** Path under public/, e.g. /investors/don.jpg */
  imageSrc: string;
  /** Short “known for” line for cards */
  tagline: string;
};

export const FEATURED_INVESTORS: FeaturedInvestor[] = [
  {
    slug: "don-durrett",
    name: "Don Durrett",
    imageSrc: "/investor-photos/don-durrett.webp",
    tagline:
      "Analyst and author on the gold cycle; known for data-driven commentary on miners, silver, and macro precious-metals themes.",
  },
  {
    slug: "eric-sprott",
    name: "Eric Sprott",
    imageSrc: "/investor-photos/eric-sprott.webp",
    tagline:
      "Canadian investor and founder of Sprott Inc.; long-time advocate of physical gold and silver and financing for quality mining names.",
  },
  {
    slug: "peter-schiff",
    name: "Peter Schiff",
    imageSrc: "/investor-photos/peter-schiff.webp",
    tagline:
      "Economist and CEO of Euro Pacific; prominent gold-focused wealth manager skeptical of fiat debasement and equity bubbles.",
  },
  {
    slug: "rick-rule",
    name: "Rick Rule",
    imageSrc: "/investor-photos/rick-rule.webp",
    tagline:
      "Natural-resources speculator and capital-markets veteran; known for contrarian resource investing and Sprott leadership.",
  },
  {
    slug: "ross-beaty",
    name: "Ross Beaty",
    imageSrc: "/investor-photos/ross-beaty.webp",
    tagline:
      "Geologist and mining entrepreneur; built major companies across base and precious metals with a focus on disciplined operations.",
  },
];
