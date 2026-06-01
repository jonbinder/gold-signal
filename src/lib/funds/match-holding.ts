export type SecurityMatchRow = {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
};

function normalizeName(value: string): string {
  return value
    .toUpperCase()
    .replace(/\b(INC|INCORPORATED|CORP|CORPORATION|LTD|LIMITED|PLC|CO|COMPANY|SA|AG|NV)\b/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Maps a 13F nameOfIssuer row to a security in our universe (best-effort).
 */
export function matchIssuerToSecurity(
  issuerName: string,
  securities: SecurityMatchRow[],
): SecurityMatchRow | null {
  const normIssuer = normalizeName(issuerName);
  if (!normIssuer) return null;

  let best: SecurityMatchRow | null = null;
  let bestScore = 0;

  for (const sec of securities) {
    const normSec = normalizeName(sec.name);
    if (!normSec) continue;

    if (normIssuer === normSec) return sec;
    if (normIssuer.includes(normSec) || normSec.includes(normIssuer)) {
      const score = Math.min(normIssuer.length, normSec.length);
      if (score > bestScore) {
        bestScore = score;
        best = sec;
      }
    }

    const ticker = sec.ticker.toUpperCase();
    if (normIssuer.includes(ticker) && ticker.length >= 2) {
      const score = ticker.length + 5;
      if (score > bestScore) {
        bestScore = score;
        best = sec;
      }
    }
  }

  return best;
}

const PM_SECTOR_RE =
  /gold|silver|royalty|streaming|precious|miner|etf/i;

export function isPreciousMetalSector(sector: string | null): boolean {
  if (!sector) return false;
  return PM_SECTOR_RE.test(sector);
}
