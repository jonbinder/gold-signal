/**
 * Holdings by tracked famous investors (13F overlap proxy).
 * Keep in sync with famousInvestors in main.js.
 */
const FAMOUS_INVESTOR_PORTFOLIOS = [
  ['WPM', 'AEM', 'PAAS', 'MAG', 'AG'],
  ['RGLD', 'NEM', 'FNV', 'GOLD'],
  ['AEM', 'KGC', 'WPM', 'OR', 'SAND'],
  ['NEM', 'GOLD', 'AEM', 'FNV'],
];

const WEIGHTS = {
  insiderBuyingScore: 0.25,
  institutionalFrequencyScore: 0.2,
  famousInvestorOverlapScore: 0.2,
  forwardPEScore: 0.15,
  currentPEScore: 0.1,
  insiderOwnershipScore: 0.1,
};

const NEUTRAL_SCORE = 50;

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/** @param {number} value @param {number} min @param {number} max */
function linearNormalize(value, min, max) {
  if (max <= min) return NEUTRAL_SCORE;
  return clamp(((value - min) / (max - min)) * 100);
}

/** @param {number|null|undefined} value @param {number} low @param {number} high */
function inverseNormalize(value, low, high) {
  if (value == null || !Number.isFinite(value)) return NEUTRAL_SCORE;
  if (value <= low) return 100;
  if (value >= high) return 0;
  return clamp(((high - value) / (high - low)) * 100);
}

/**
 * Classify Form 4 transaction as buy, sell, or neutral.
 * @param {import('./api.js').InsiderTransaction} tx
 */
function classifyInsiderTransaction(tx) {
  const type = String(tx.transactionType ?? '').toUpperCase();
  const buyPattern = /^(P|A|BUY|ACQUIRE|ACQUISITION)/;
  const sellPattern = /^(S|D|SELL|DISPOSE|DISPOSITION)/;

  if (buyPattern.test(type)) return 'buy';
  if (sellPattern.test(type)) return 'sell';
  return 'neutral';
}

/**
 * insiderBuyingScore (25%)
 * Normalization: Compare dollar-weighted buy vs sell volume from recent insider filings.
 * Net buying ratio = buyShares / (buyShares + sellShares). Maps 0→0, 0.5→50, 1→100.
 * Missing activity defaults to neutral 50.
 * @param {import('./api.js').InsiderTransaction[]} transactions
 */
export function scoreInsiderBuying(transactions = []) {
  let buyShares = 0;
  let sellShares = 0;

  transactions.forEach((tx) => {
    const shares = Math.abs(Number(tx.shares) || 0);
    if (!shares) return;

    const side = classifyInsiderTransaction(tx);
    if (side === 'buy') buyShares += shares;
    else if (side === 'sell') sellShares += shares;
  });

  const total = buyShares + sellShares;
  if (total === 0) return NEUTRAL_SCORE;

  return clamp((buyShares / total) * 100);
}

/**
 * institutionalFrequencyScore (20%)
 * Normalization: Map 13F holder count to conviction. Few institutions (<20) score low;
 * deep institutional interest (150+) scores high. Linear scale between 20 and 150 holders.
 * @param {number|null} institutionalCount
 */
export function scoreInstitutionalFrequency(institutionalCount) {
  if (institutionalCount == null || !Number.isFinite(institutionalCount)) {
    return NEUTRAL_SCORE;
  }

  const MIN_HOLDERS = 20;
  const MAX_HOLDERS = 150;
  return linearNormalize(institutionalCount, MIN_HOLDERS, MAX_HOLDERS);
}

/**
 * famousInvestorOverlapScore (20%)
 * Normalization: Each tracked famous investor portfolio that includes the ticker
 * adds 25 points (4 investors max → 100). No overlap = 0.
 * @param {string} ticker
 */
export function scoreFamousInvestorOverlap(ticker) {
  const symbol = String(ticker).trim().toUpperCase();
  const overlapCount = FAMOUS_INVESTOR_PORTFOLIOS.filter((group) =>
    group.includes(symbol)
  ).length;

  return clamp((overlapCount / FAMOUS_INVESTOR_PORTFOLIOS.length) * 100);
}

/**
 * forwardPEScore (15%)
 * Normalization: Lower forward P/E is better (cheaper forward earnings).
 * P/E ≤12 → 100, P/E ≥35 → 0, linear between (typical precious-metals range).
 * @param {number|null} forwardPE
 */
export function scoreForwardPE(forwardPE) {
  return inverseNormalize(forwardPE, 12, 35);
}

/**
 * currentPEScore (10%)
 * Normalization: Lower trailing P/E is better. Same inverse scale as forward P/E
 * so valuation is comparable across the two metrics.
 * @param {number|null} peRatio
 */
export function scoreCurrentPE(peRatio) {
  return inverseNormalize(peRatio, 12, 35);
}

/**
 * insiderOwnershipScore (10%)
 * Normalization: Proxy for insider conviction breadth—% of active insiders who are
 * net buyers in the sample (unique buyers / unique actors). Ownership % is not in
 * fetchSignalData; breadth of buying insiders approximates rising insider alignment.
 * @param {import('./api.js').InsiderTransaction[]} transactions
 */
export function scoreInsiderOwnership(transactions = []) {
  const buyers = new Set();
  const actors = new Set();

  transactions.forEach((tx) => {
    const name = tx.insiderName ?? 'unknown';
    const side = classifyInsiderTransaction(tx);
    if (side === 'neutral') return;

    actors.add(name);
    if (side === 'buy') buyers.add(name);
  });

  if (actors.size === 0) return NEUTRAL_SCORE;

  return clamp((buyers.size / actors.size) * 100);
}

/**
 * Compute composite SignalScore (0–100) from Polygon signal data.
 * @param {import('./api.js').SignalData} data
 * @returns {{
 *   signalScore: number,
 *   subScores: {
 *     insiderBuyingScore: number,
 *     institutionalFrequencyScore: number,
 *     famousInvestorOverlapScore: number,
 *     forwardPEScore: number,
 *     currentPEScore: number,
 *     insiderOwnershipScore: number,
 *   },
 *   weights: typeof WEIGHTS,
 * }}
 */
export function calculateSignalScore(data) {
  const subScores = {
    insiderBuyingScore: scoreInsiderBuying(data.insiderTransactions),
    institutionalFrequencyScore: scoreInstitutionalFrequency(data.institutionalCount),
    famousInvestorOverlapScore: scoreFamousInvestorOverlap(data.ticker),
    forwardPEScore: scoreForwardPE(data.forwardPE),
    currentPEScore: scoreCurrentPE(data.peRatio),
    insiderOwnershipScore: scoreInsiderOwnership(data.insiderTransactions),
  };

  const weighted =
    subScores.insiderBuyingScore * WEIGHTS.insiderBuyingScore +
    subScores.institutionalFrequencyScore * WEIGHTS.institutionalFrequencyScore +
    subScores.famousInvestorOverlapScore * WEIGHTS.famousInvestorOverlapScore +
    subScores.forwardPEScore * WEIGHTS.forwardPEScore +
    subScores.currentPEScore * WEIGHTS.currentPEScore +
    subScores.insiderOwnershipScore * WEIGHTS.insiderOwnershipScore;

  return {
    signalScore: Math.round(clamp(weighted)),
    subScores,
    weights: { ...WEIGHTS },
  };
}
