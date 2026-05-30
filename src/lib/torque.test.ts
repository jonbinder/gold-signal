import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DailyBar } from "@/lib/polygon";
import {
  BETA_WINDOW_DAYS,
  R2_FLOOR,
  TORQUE_MAX,
  TORQUE_MIN,
  computeReturnBeta,
  computeTorqueMultiplier,
  type TorqueInputs,
} from "./torque";

function makeTrendBars(start: number, step: number, count: number, prefix = "2024"): DailyBar[] {
  const bars: DailyBar[] = [];
  for (let i = 0; i < count; i++) {
    const close = start + step * i;
    const day = String((i % 28) + 1).padStart(2, "0");
    const month = String(Math.floor(i / 28) + 1).padStart(2, "0");
    bars.push({
      date: `${prefix}-${month}-${day}`,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1,
    });
  }
  return bars;
}

function baseTorque(overrides: Partial<TorqueInputs> = {}): TorqueInputs {
  return {
    beta: 1.2,
    rSquared: 0.4,
    universeMedianBeta: 1,
    universeMinBeta: 0.5,
    universeMaxBeta: 1.5,
    universeValidBetaCount: 25,
    metalProxy: "GLD",
    ...overrides,
  };
}

describe("computeReturnBeta", () => {
  it("returns beta ~1 for parallel return streams", () => {
    const stock = makeTrendBars(100, 0.5, 120);
    const metal = makeTrendBars(50, 0.25, 120);
    const result = computeReturnBeta(stock, metal);
    assert.ok(result);
    assert.ok(result!.beta > 0.8 && result!.beta < 1.2);
    assert.ok(result!.rSquared > 0.9);
  });

  it("returns null with insufficient history", () => {
    const stock = makeTrendBars(100, 0.5, 10);
    assert.equal(computeReturnBeta(stock, stock), null);
  });
});

describe("computeTorqueMultiplier", () => {
  it("maps universe median beta to 1.0", () => {
    const result = computeTorqueMultiplier(baseTorque({ beta: 1 }));
    assert.equal(result.torqueMultiplier, 1);
    assert.equal(result.r2GateTriggered, false);
  });

  it("approaches TORQUE_MAX for high beta", () => {
    const result = computeTorqueMultiplier(baseTorque({ beta: 1.5 }));
    assert.equal(result.torqueMultiplier, TORQUE_MAX);
  });

  it("approaches TORQUE_MIN for low beta", () => {
    const result = computeTorqueMultiplier(baseTorque({ beta: 0.5 }));
    assert.equal(result.torqueMultiplier, TORQUE_MIN);
  });

  it("uses neutral multiplier when R² is below floor", () => {
    const result = computeTorqueMultiplier(baseTorque({ rSquared: R2_FLOOR - 0.01 }));
    assert.equal(result.torqueMultiplier, 1);
    assert.equal(result.r2GateTriggered, true);
  });

  it("uses neutral multiplier when beta is missing", () => {
    const result = computeTorqueMultiplier(
      baseTorque({ beta: null, rSquared: null }),
    );
    assert.equal(result.torqueMultiplier, 1);
    assert.equal(result.betaMissing, true);
  });

  it("uses neutral multiplier when universe baseline is unavailable", () => {
    const result = computeTorqueMultiplier(
      baseTorque({
        universeMedianBeta: null,
        universeMinBeta: null,
        universeMaxBeta: null,
        universeValidBetaCount: 0,
      }),
    );
    assert.equal(result.torqueMultiplier, 1);
    assert.equal(result.universeFallback, true);
  });
});

describe("constants", () => {
  it("uses a ~252-day beta window", () => {
    assert.equal(BETA_WINDOW_DAYS, 252);
  });
});
