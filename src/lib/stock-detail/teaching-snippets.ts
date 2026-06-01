/** Placeholder teaching copy for stock detail sections — swap keys later. */
const SNIPPETS: Record<string, string> = {
  stock_insider:
    "Form 4 filings show who inside the company is buying or selling stock, how much, and when. It is among the freshest public smart-money data for a single name.",
  stock_institutional:
    "13F filings report what large investment managers held at quarter-end. There is always a lag — positions can change before the next filing.",
};

export function getStockDetailTeaching(key: "stock_insider" | "stock_institutional"): string {
  return SNIPPETS[key] ?? "";
}
