/**
 * Curated investor roster for /investors (static).
 * Images live in public/investors/ (lowercase first name + .jpg).
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
    imageSrc: "/investors/don.jpg",
    tagline:
      "Analyst and author on the gold cycle; known for data-driven commentary on miners, silver, and macro precious-metals themes.",
  },
  {
    slug: "eric-sprott",
    name: "Eric Sprott",
    imageSrc: "/investors/eric.jpg",
    tagline:
      "Canadian investor and founder of Sprott Inc.; long-time advocate of physical gold and silver and financing for quality mining names.",
  },
  {
    slug: "peter-schiff",
    name: "Peter Schiff",
    imageSrc: "/investors/peter.jpg",
    tagline:
      "Economist and CEO of Euro Pacific; prominent gold-focused wealth manager skeptical of fiat debasement and equity bubbles.",
  },
  {
    slug: "rick-rule",
    name: "Rick Rule",
    imageSrc: "/investors/rick.jpg",
    tagline:
      "Natural-resources speculator and capital-markets veteran; known for contrarian resource investing and Sprott leadership.",
  },
  {
    slug: "ross-beaty",
    name: "Ross Beaty",
    imageSrc: "/investors/ross.jpg",
    tagline:
      "Geologist and mining entrepreneur; built major companies across base and precious metals with a focus on disciplined operations.",
  },
];
