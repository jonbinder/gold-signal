import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { StockRankingResult, SubScoreKey } from "@/lib/ranking";
import { gradeBackground, gradeColor, PDF_COLORS, scoreColor } from "@/lib/pdf/colors";
import { portfolioSummarySentence, subScoreExplanation, subScoreLabel, topPickAndWatchOut } from "@/lib/pdf/report-copy";

const SUB_SCORE_ORDER: SubScoreKey[] = [
  "institutional",
  "insider",
  "pe",
  "famousInvestor",
  "support",
  "correlation",
  "fcfYield",
];

export type SignalScoreReportProps = {
  userName: string;
  reportDate: string;
  portfolioScore: number;
  portfolioGrade: string;
  rankings: StockRankingResult[];
  logoSrc?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: PDF_COLORS.ink,
    backgroundColor: PDF_COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    paddingBottom: 16,
  },
  logo: { width: 36, height: 36 },
  brand: { fontSize: 14, fontWeight: 700, color: PDF_COLORS.gold },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8 },
  subtitle: { fontSize: 11, color: PDF_COLORS.muted, marginBottom: 20 },
  gradeBox: {
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  gradeLetter: { fontSize: 48, fontWeight: 700 },
  scoreBig: { fontSize: 28, fontWeight: 700, marginTop: 8 },
  calloutRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  callout: {
    flex: 1,
    padding: 12,
    backgroundColor: PDF_COLORS.goldPale,
    borderRadius: 6,
  },
  calloutLabel: { fontSize: 8, color: PDF_COLORS.muted, textTransform: "uppercase", marginBottom: 4 },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
    marginTop: 8,
  },
  stockTitle: { fontSize: 14, fontWeight: 700 },
  stockScore: { fontSize: 20, fontWeight: 700 },
  barTrack: {
    height: 6,
    backgroundColor: PDF_COLORS.border,
    borderRadius: 3,
    marginBottom: 6,
  },
  barFill: { height: 6, borderRadius: 3 },
  signalRow: { marginBottom: 8 },
  signalLabel: { fontSize: 9, marginBottom: 2 },
  signalNote: { fontSize: 8, color: PDF_COLORS.muted },
  footer: { marginTop: 24, fontSize: 8, color: PDF_COLORS.muted, lineHeight: 1.4 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8, marginTop: 16 },
});

function ScoreBar({ score }: { score: number }) {
  const width = `${Math.max(4, score)}%`;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width, backgroundColor: scoreColor(score) }]} />
    </View>
  );
}

export function SignalScoreReport({
  userName,
  reportDate,
  portfolioScore,
  portfolioGrade,
  rankings,
  logoSrc,
}: SignalScoreReportProps) {
  const summary = portfolioSummarySentence(portfolioScore);
  const { top, bottom } = topPickAndWatchOut(rankings);
  const gColor = gradeColor(portfolioGrade);
  const gBg = gradeBackground(portfolioGrade);

  return (
    <Document title="SignalScore Portfolio Review">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : <View style={styles.logo} />}
          <Text style={styles.brand}>GoldSignal.ai</Text>
        </View>

        <Text style={styles.title}>Your SignalScore Portfolio Review</Text>
        <Text style={styles.subtitle}>
          Prepared for {userName} · {reportDate}
        </Text>

        <View style={[styles.gradeBox, { backgroundColor: gBg }]}>
          <Text style={[styles.gradeLetter, { color: gColor }]}>{portfolioGrade}</Text>
          <Text style={[styles.scoreBig, { color: gColor }]}>Portfolio SignalScore {portfolioScore}</Text>
        </View>

        <Text>{summary}</Text>

        <View style={styles.calloutRow}>
          {top && (
            <View style={styles.callout}>
              <Text style={styles.calloutLabel}>Top pick</Text>
              <Text>
                {top.ticker} ({top.score}) — {top.reason}
              </Text>
            </View>
          )}
          {bottom && (
            <View style={styles.callout}>
              <Text style={styles.calloutLabel}>Watch out</Text>
              <Text>
                {bottom.ticker} ({bottom.score}) — {bottom.reason}
              </Text>
            </View>
          )}
        </View>
      </Page>

      {rankings.map((stock) => (
        <Page key={stock.ticker} size="LETTER" style={styles.page}>
          <View style={styles.stockHeader}>
            <View>
              <Text style={styles.stockTitle}>
                {stock.ticker}
                {stock.companyName ? ` · ${stock.companyName}` : ""}
              </Text>
            </View>
            <Text style={[styles.stockScore, { color: scoreColor(stock.signalScore) }]}>
              {stock.signalScore}
            </Text>
          </View>

          {SUB_SCORE_ORDER.map((key) => (
            <View key={key} style={styles.signalRow}>
              <Text style={styles.signalLabel}>
                {subScoreLabel(key)} — {stock.subScores[key].score}
                {stock.subScores[key].missing ? " (estimated)" : ""}
              </Text>
              <ScoreBar score={stock.subScores[key].score} />
              <Text style={styles.signalNote}>{subScoreExplanation(stock, key)}</Text>
            </View>
          ))}
        </Page>
      ))}

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Methodology</Text>
        <Text style={{ marginBottom: 8, lineHeight: 1.5 }}>
          The SignalScore combines seven proprietary signals — institutional 13F data, insider
          activity, PE ratio, famous investor holdings, 52-week support, gold price correlation,
          and free cash flow yield — into a single 0–100 conviction score for each holding.
        </Text>
        <Text style={{ marginBottom: 16 }}>
          Full methodology: https://goldsignal.ai/signalscore
        </Text>
        <Text style={styles.footer}>
          Disclaimer: This report is for informational purposes only and does not constitute
          investment advice, an offer, or a solicitation to buy or sell any security. Past
          performance and model scores are not indicative of future results. Consult a qualified
          financial advisor before making investment decisions.
        </Text>
        <Text style={[styles.footer, { marginTop: 12 }]}>© GoldSignal.ai</Text>
      </Page>
    </Document>
  );
}
