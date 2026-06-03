const TRAILING_LEGAL_SUFFIX =
  /\s+(Corporation|Corp\.?|Inc\.?|Incorporated|Ltd\.?|Limited|Co\.?|Company)\s*$/i;

/**
 * Short display name for the stocks table: strip "Common Stock" and legal suffixes, cap length.
 */
export function formatDisplayCompanyName(raw: string): string {
  let name = raw.trim();
  if (!name) return "";

  name = name.replace(/\s+Common Stock\s*$/i, "");
  while (TRAILING_LEGAL_SUFFIX.test(name)) {
    name = name.replace(TRAILING_LEGAL_SUFFIX, "");
  }

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return words.join(" ");
  if (words.includes("&") && words.length <= 4) return words.join(" ");
  return words.slice(0, 3).join(" ");
}
