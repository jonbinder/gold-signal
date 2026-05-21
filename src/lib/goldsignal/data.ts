import fs from "fs";
import path from "path";

export type Stock = {
  ticker: string;
  company: string;
  sector: string;
  monthlyChange: number;
  signalScore: number;
};

export type InvestorHolding = {
  rank: number;
  company: string;
  ticker: string;
  weight: number | null;
  notes: string;
};

export type Investor = {
  slug: string;
  name: string;
  sheetName: string;
  role: string;
  aum: string;
  positionCount: number;
  thesis: string;
  bio: string;
  tickers: string[];
  holdings: InvestorHolding[];
};

type InvestorsFile = {
  updatedAt: string;
  investors: Investor[];
};

const dataDir = path.join(process.cwd(), "public", "data");

export function getStocks(): Stock[] {
  const raw = fs.readFileSync(path.join(dataDir, "stocks.json"), "utf8");
  const stocks = JSON.parse(raw) as Stock[];
  return [...stocks].sort((a, b) => b.signalScore - a.signalScore);
}

export function getInvestors(): Investor[] {
  const raw = fs.readFileSync(path.join(dataDir, "investors.json"), "utf8");
  const file = JSON.parse(raw) as InvestorsFile;
  return file.investors;
}

export function getInvestorBySlug(slug: string): Investor | undefined {
  return getInvestors().find((inv) => inv.slug === slug);
}

export function getScoreTier(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong Conviction";
  if (score >= 60) return "Moderate Conviction";
  return "Weak Conviction";
}

export function formatMonthlyChange(value: number): { text: string; className: string } {
  const n = Number(value);
  if (n > 0) {
    return { text: `▲ +${Math.abs(n).toFixed(1)}%`, className: "change change--up" };
  }
  if (n < 0) {
    return { text: `▼ ${n.toFixed(1)}%`, className: "change change--down" };
  }
  return { text: "— 0.0%", className: "change change--flat" };
}

export { investorInitials } from "@/lib/investor-initials";
