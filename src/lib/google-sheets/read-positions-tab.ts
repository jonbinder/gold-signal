import { getGoogleSheetsAccessToken, parseGooglePrivateKey } from "@/lib/google-sheets/auth";

export type SheetEnvConfig = {
  spreadsheetId: string;
  tabName: string;
  clientEmail: string;
  privateKey: string;
};

export function readSheetEnvConfig(): SheetEnvConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey =
    parseGooglePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) ??
    parseGooglePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME?.trim() || "Sheet1";
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return { spreadsheetId, tabName, clientEmail, privateKey };
}

/** Read all rows from the positions tab (row 1 = headers). */
export async function readInvestorPositionsSheet(config: SheetEnvConfig): Promise<string[][]> {
  const token = await getGoogleSheetsAccessToken(config.clientEmail, config.privateKey);
  const range = encodeURIComponent(`${config.tabName}!A:Z`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Sheets read failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { values?: Array<Array<string | number | boolean | null>> };
  return normalizeSheetGrid(json.values ?? []);
}

/**
 * Google Sheets sometimes returns one TSV blob per row (single column) when pasted from mobile.
 * Split tab-separated cells into proper columns. Coerce all cell values to strings.
 */
export function normalizeSheetGrid(values: Array<Array<string | number | boolean | null | undefined>>): string[][] {
  const coerceRow = (row: Array<string | number | boolean | null | undefined>): string[] =>
    row.map((c) => (c == null ? "" : String(c).trim()));

  if (values.length === 0) return [];

  const coerced = values.map(coerceRow);

  const looksTabSeparated =
    coerced[0]?.length === 1 && (coerced[0][0]?.includes("\t") ?? false);

  if (!looksTabSeparated) return coerced;

  return coerced
    .map((row) => {
      if (row.length === 1) {
        return row[0]!.split("\t").map((c) => c.trim());
      }
      if (row.some((c) => c.includes("\t"))) {
        return row.flatMap((c) => c.split("\t")).map((c) => c.trim());
      }
      return row;
    })
    .filter((row) => row.some((c) => c.length > 0));
}
