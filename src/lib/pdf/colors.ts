/** Brand-aligned PDF palette (matches GoldSignal site). */
export const PDF_COLORS = {
  ink: "#111009",
  gold: "#C9971C",
  goldPale: "#FBF3DC",
  white: "#FFFFFF",
  muted: "#5C5649",
  green: "#2D6A4F",
  greenBg: "#EAF4EE",
  yellow: "#B8860B",
  yellowBg: "#FFF8E6",
  orange: "#C45C26",
  orangeBg: "#FFF0E8",
  red: "#8B2635",
  redBg: "#FCE8EC",
  border: "#E8E2D6",
} as const;

export function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return PDF_COLORS.green;
  if (grade.startsWith("B") || grade.startsWith("C")) return PDF_COLORS.yellow;
  if (grade === "D") return PDF_COLORS.orange;
  return PDF_COLORS.red;
}

export function gradeBackground(grade: string): string {
  if (grade.startsWith("A")) return PDF_COLORS.greenBg;
  if (grade.startsWith("B") || grade.startsWith("C")) return PDF_COLORS.yellowBg;
  if (grade === "D") return PDF_COLORS.orangeBg;
  return PDF_COLORS.redBg;
}

export function scoreColor(score: number): string {
  if (score >= 71) return PDF_COLORS.green;
  if (score >= 41) return PDF_COLORS.yellow;
  return PDF_COLORS.red;
}
