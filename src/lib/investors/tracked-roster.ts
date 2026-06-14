/** Canonical roster for /investors (14 slugs; Eric Sprott + Sprott Inc. are separate entries). */
export const TRACKED_INVESTOR_SLUGS = [
  "garrett-goggin",
  "adrian-day",
  "ross-beaty",
  "eric-sprott",
  "peter-schiff",
  "rick-rule",
  "sprott-inc",
  "jon-binder",
  "lawrence-lepard",
  "frank-giustra",
  "rob-mcewen",
  "pierre-lassonde",
  "doug-casey",
  "don-durrett",
] as const;

export type TrackedInvestorSlug = (typeof TRACKED_INVESTOR_SLUGS)[number];

/** Legacy slugs merged into the canonical roster (e.g. pre-rename Sprott entity). */
export const TRACKED_INVESTOR_SLUG_ALIASES: Record<string, TrackedInvestorSlug> = {
  "sprott-asset-management-funds": "sprott-inc",
  "sprott-asset-management": "sprott-inc",
};

const TRACKED_SET = new Set<string>(TRACKED_INVESTOR_SLUGS);

export function normalizeTrackedInvestorSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();
  return TRACKED_INVESTOR_SLUG_ALIASES[trimmed] ?? trimmed;
}

export function isTrackedInvestorSlug(slug: string): boolean {
  return TRACKED_SET.has(normalizeTrackedInvestorSlug(slug));
}

export const TRACKED_INVESTOR_COUNT = TRACKED_INVESTOR_SLUGS.length;
