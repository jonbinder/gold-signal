/**
 * Placeholder teaching lines for the lead story. Swap keys or replace this map later.
 */
const SNIPPETS: Record<string, string> = {
  insider_buy_default:
    "Open-market insider purchases are a public vote of confidence — worth reading alongside the size and role of the buyer.",
  insider_buy_ceo:
    "When a CEO buys on the open market, they are putting personal capital at risk alongside shareholders — one of the clearest Form 4 signals.",
  insider_sell_default:
    "Insider sales happen for many reasons (taxes, diversification). Context matters more than the headline alone.",
  stake_13d_default:
    "A new 13D means an investor crossed 5% and may seek influence — the filing spells out intent and position size.",
  stake_13g_default:
    "13G filings report passive 5%+ stakes — useful for seeing which institutions are accumulating without activist intent.",
  institutional_add:
    "When a tracked fund adds meaningfully in a 13F quarter, it shows where professional precious-metals capital moved on the margin.",
  institutional_reduce:
    "A material 13F trim does not always mean a bearish view — funds rebalance, take profits, or rotate within the sector.",
  institutional_new:
    "A brand-new 13F position flags fresh institutional interest in that quarter's filing window.",
  institutional_sell:
    "A full exit in 13F data means the fund no longer reports the position — worth checking if it was a full sale or below reporting thresholds.",
  stock_insider_default:
    "Form 4 filings show insider buys and sells within days — the freshest public signal of how management and directors are positioned.",
  stock_insider_ceo:
    "CEO open-market activity is especially worth watching because it ties executive compensation and reputation directly to the stock.",
  stock_institutional_default:
    "13F data lags by a quarter, but it shows which professional funds actually held the name at period end — useful for context, not timing.",
  stock_institutional_new:
    "A new 13F line item means at least one tracked fund initiated exposure in the latest filed quarter.",
  stock_institutional_trim:
    "Quarter-over-quarter trims in 13F filings can reflect profit-taking or rotation — not always a bearish thesis change.",
  stock_institutional_exits:
    "When tracked funds fully exit in 13F data, the stock may drop off their reported books entirely — verify against later filings.",
  email_insider_default:
    "Form 4 filings are the freshest public window into insider conviction — read the role, size, and whether the trade was open market.",
  email_insider_ceo:
    "When a CEO buys on the open market, they are aligning personal capital with shareholders — one of the clearest signals in the filing stream.",
  email_institutional_default:
    "13F data shows which professional funds held the name at quarter-end. It always lags — use it for context, not for timing entries.",
  email_institutional_new:
    "A new name on a fund's 13F can flag fresh institutional interest in that filing window — worth pairing with price and insider data.",
  email_institutional_trim:
    "Quarterly trims in 13F filings often reflect rebalancing or profit-taking rather than a full thesis reversal.",
  email_institutional_exits:
    "A full 13F exit means the fund no longer reports the position — confirm whether it was a sale or fell below reporting thresholds.",
};

export function getTeachingSnippet(key: string): string {
  return SNIPPETS[key] ?? SNIPPETS.insider_buy_default;
}

export function pickTeachingKey(item: {
  kind: import("./types").FeedActivityKind;
  subline?: string;
}): string {
  if (item.kind === "insider_buy") {
    const role = item.subline?.toLowerCase() ?? "";
    if (role.includes("ceo") || role.includes("chief executive")) return "insider_buy_ceo";
    return "insider_buy_default";
  }
  if (item.kind === "insider_sell") return "insider_sell_default";
  if (item.kind === "stake_13d") return "stake_13d_default";
  if (item.kind === "stake_13g") return "stake_13g_default";
  if (item.kind === "institutional") {
    if (item.subline?.toLowerCase().includes("new position")) return "institutional_new";
    if (item.subline?.toLowerCase().includes("exit")) return "institutional_sell";
    if (item.subline?.toLowerCase().includes("trim") || item.subline?.toLowerCase().includes("reduced"))
      return "institutional_reduce";
    return "institutional_add";
  }
  return "insider_buy_default";
}
