import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import type { StockRankingResult } from "@/lib/ranking";
import { SignalScoreReport } from "@/lib/pdf/SignalScoreReport";

/**
 * Loads the site logo as a data URI for embedding in the PDF.
 */
export async function loadReportLogoDataUri(): Promise<string | undefined> {
  const candidates = [
    path.join(process.cwd(), "src/app/icon.png"),
    path.join(process.cwd(), "public/images/gs-phone.png"),
  ];
  for (const filePath of candidates) {
    try {
      const buf = await readFile(filePath);
      return `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      continue;
    }
  }
  return undefined;
}

/**
 * Renders the SignalScore PDF report to a Buffer.
 */
export async function generateSignalScorePdf(params: {
  userName: string;
  reportDate: string;
  portfolioScore: number;
  portfolioGrade: string;
  rankings: StockRankingResult[];
}): Promise<Buffer> {
  const logoSrc = await loadReportLogoDataUri();
  const buffer = await renderToBuffer(
    <SignalScoreReport {...params} logoSrc={logoSrc} />,
  );
  return Buffer.from(buffer);
}
