"use client";

import { useCallback, useMemo, useState } from "react";

type TierColor = "green" | "amber" | "orange" | "red";

type ScoreTier = {
  min: number;
  max: number;
  label: string;
  color: TierColor;
  description: string;
};

const SCORE_TIERS: ScoreTier[] = [
  {
    min: 90,
    max: 100,
    label: "Exceptional",
    color: "green",
    description:
      "Rare alignment across smart-money footprints with favorable or neutral gold torque. Institutions accumulating, insiders buying, and famous specialists present. Worth serious attention.",
  },
  {
    min: 80,
    max: 89,
    label: "Strong conviction",
    color: "green",
    description:
      "Multiple footprint signals aligned. Institutions adding, insiders supportive, and tracked famous investors in the name. These are the stocks GoldSignal ranks highest.",
  },
  {
    min: 65,
    max: 79,
    label: "Promising",
    color: "amber",
    description:
      "More footprint positives than negatives. Some smart-money signals are strong but others are neutral or mixed. Worth watching — torque may nudge the score slightly up or down.",
  },
  {
    min: 45,
    max: 64,
    label: "Neutral",
    color: "amber",
    description:
      "Footprint data is mixed. No strong smart-money conviction, but no major red flags either. May need a filing catalyst before the score moves meaningfully.",
  },
  {
    min: 20,
    max: 44,
    label: "Weak",
    color: "orange",
    description:
      "More footprint negatives than positives. Institutions may be trimming, insiders quiet or selling, and famous-investor overlap thin. Approach with caution until filings improve.",
  },
  {
    min: 0,
    max: 19,
    label: "Avoid",
    color: "red",
    description:
      "Significant red flags across smart-money footprints. Institutional selling, insider distribution, or absent specialist interest. Gold torque rarely rescues a weak base.",
  },
];

function tierMidpoint(tier: ScoreTier): number {
  return Math.round((tier.min + tier.max) / 2);
}

function tierForScore(score: number): ScoreTier {
  return (
    SCORE_TIERS.find((tier) => score >= tier.min && score <= tier.max) ??
    SCORE_TIERS[SCORE_TIERS.length - 1]
  );
}

function formatRange(tier: ScoreTier): string {
  return `Score ${tier.min} to ${tier.max}`;
}

export function ScoreReferenceGuide() {
  const [score, setScore] = useState(85);

  const activeTier = useMemo(() => tierForScore(score), [score]);
  const activeIndex = SCORE_TIERS.indexOf(activeTier);

  const selectTier = useCallback((tier: ScoreTier) => {
    setScore(tierMidpoint(tier));
  }, []);

  return (
    <section className="score-reference" aria-labelledby="score-reference-title">
      <header className="score-reference__header">
        <h2 id="score-reference-title" className="score-reference__title">
          Score Reference Guide
        </h2>
        <p className="score-reference__intro">
          Drag the slider or select a tier to see what each SignalScore range means.
        </p>
      </header>

      <div className={`score-reference__live score-reference__live--${activeTier.color}`}>
        <div className="score-reference__live-score mono">{score}</div>
        <div className="score-reference__live-meta">
          <p className="score-reference__live-range">{formatRange(activeTier)}</p>
          <p className="score-reference__live-label">{activeTier.label}</p>
        </div>
        <p className="score-reference__live-desc">{activeTier.description}</p>
      </div>

      <div className="score-reference__slider-wrap">
        <label className="score-reference__slider-label" htmlFor="score-reference-slider">
          Explore score ranges
        </label>
        <div className="score-reference__slider-track">
          <div className="score-reference__slider-segments" aria-hidden="true">
            {SCORE_TIERS.map((tier) => (
              <span
                key={tier.label}
                className={`score-reference__segment score-reference__segment--${tier.color}`}
                style={{ flex: tier.max - tier.min + 1 }}
              />
            ))}
          </div>
          <div className="score-reference__slider-dots" aria-hidden="true">
            {SCORE_TIERS.map((tier, index) => (
              <span
                key={tier.label}
                className={`score-reference__dot score-reference__dot--${tier.color}${
                  index === activeIndex ? " score-reference__dot--active" : ""
                }`}
                style={{ left: `${tierMidpoint(tier)}%` }}
              />
            ))}
          </div>
          <input
            id="score-reference-slider"
            type="range"
            className={`score-reference__slider score-reference__slider--${activeTier.color}`}
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-valuetext={`${score}, ${activeTier.label}`}
          />
        </div>
        <div className="score-reference__slider-ends mono" aria-hidden="true">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <ul className="score-reference__tiers">
        {SCORE_TIERS.map((tier, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={tier.label}>
              <button
                type="button"
                className={`score-reference__tier score-reference__tier--${tier.color}${
                  isActive ? " score-reference__tier--active" : ""
                }`}
                onClick={() => selectTier(tier)}
                aria-pressed={isActive}
              >
                <span
                  className={`score-reference__tier-dot score-reference__tier-dot--${tier.color}`}
                  aria-hidden="true"
                />
                <span className="score-reference__tier-range">{formatRange(tier)}</span>
                <span className="score-reference__tier-label">{tier.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
