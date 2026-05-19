import { getScoreTier } from "@/lib/goldsignal/data";

export function ScoreBadge({ score }: { score: number }) {
  const tier = getScoreTier(score);
  return <span className={`mono score score--${tier}`}>{score}</span>;
}
