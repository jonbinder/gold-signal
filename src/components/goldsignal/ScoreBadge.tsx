import { getScoreTier } from "@/lib/goldsignal/data";

/** DORMANT — not imported by any active page. */
export function ScoreBadge({ score }: { score: number }) {
  const tier = getScoreTier(score);
  return <span className={`mono score score--${tier}`}>{score}</span>;
}
