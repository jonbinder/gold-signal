// TODO: Google Sheets JWT auth disabled — portfolio positions read from data/GS-Investors.csv.
import { createSign } from "crypto";

function base64Url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function unwrapQuotes(value: string): string {
  const t = value.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function normalizePemNewlines(value: string): string {
  let s = value;
  for (let i = 0; i < 3 && s.includes("\\n"); i += 1) {
    s = s.replace(/\\n/g, "\n");
  }
  return s;
}

/** Re-wrap a single-line PEM into standard multiline form. */
function reflowSingleLinePem(value: string): string {
  if (!value.includes("BEGIN") || value.includes("\n")) return value;
  const match = value.match(/(-----BEGIN [^-]+-----)\s*([A-Za-z0-9+/=\s]+)\s*(-----END [^-]+-----)/);
  if (!match) return value;
  const body = match[2]!.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `${match[1]}\n${lines.join("\n")}\n${match[3]}\n`;
}

/**
 * Service account private key from env.
 * Supports literal \\n (Vercel), quoted values, single-line PEM, or full JSON.
 */
export function parseGooglePrivateKey(raw: string | undefined): string | null {
  const trimmed = unwrapQuotes(raw ?? "");
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { private_key?: string };
      if (typeof parsed.private_key === "string") {
        return parseGooglePrivateKey(parsed.private_key);
      }
    } catch {
      /* not JSON */
    }
  }

  let key = normalizePemNewlines(trimmed);
  key = reflowSingleLinePem(key);
  if (!key.includes("BEGIN")) return null;
  if (!key.endsWith("\n")) key += "\n";
  return key;
}

export async function getGoogleSheetsAccessToken(
  clientEmail: string,
  privateKeyPem: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();

  let signature: Buffer;
  try {
    signature = signer.sign(privateKeyPem);
  } catch (err) {
    const hint =
      "Check GOOGLE_SERVICE_ACCOUNT_KEY on Vercel: paste the private_key from your JSON file with \\n for line breaks, or set GOOGLE_SERVICE_ACCOUNT_JSON to the full JSON.";
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${message}. ${hint}`);
  }

  const assertion = `${unsigned}.${base64Url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google token response missing access_token");
  return json.access_token;
}
