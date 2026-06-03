import { NextResponse } from "next/server";
import { appendPolygonApiKey, extractPolygonBranding } from "@/lib/stock-branding";
import { getTickerDetails, normalizeTicker } from "@/lib/polygon";

export const runtime = "nodejs";

type LogoCacheEntry = {
  body: ArrayBuffer;
  contentType: string;
  expiresAt: number;
};

const LOGO_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const logoBytesCache = new Map<string, LogoCacheEntry>();

function getPolygonApiKey(): string | null {
  const raw = process.env.POLYGON_API_KEY;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticker: string }> },
): Promise<NextResponse> {
  const { ticker: rawTicker } = await context.params;
  const sym = normalizeTicker(rawTicker);
  if (!sym) {
    return new NextResponse(null, { status: 404 });
  }

  const cached = logoBytesCache.get(sym);
  if (cached && Date.now() < cached.expiresAt) {
    return new NextResponse(cached.body, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  const apiKey = getPolygonApiKey();
  if (!apiKey) {
    return new NextResponse(null, { status: 404 });
  }

  const details = await getTickerDetails(sym);
  const branding = details.ok ? extractPolygonBranding(details.data.raw) : null;
  if (!branding) {
    return new NextResponse(null, { status: 404 });
  }

  const candidates = [branding.icon_url, branding.logo_url].filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0,
  );
  if (candidates.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  let imageRes: Response | null = null;
  for (const candidate of candidates) {
    const fetchUrl = appendPolygonApiKey(candidate.trim(), apiKey);
    const attempt = await fetch(fetchUrl, {
      headers: { Accept: "image/*" },
      next: { revalidate: 86400 },
    });
    if (attempt.ok) {
      imageRes = attempt;
      break;
    }
  }

  if (!imageRes) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await imageRes.arrayBuffer();
  if (!body.byteLength) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = imageRes.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  logoBytesCache.set(sym, { body, contentType, expiresAt: Date.now() + LOGO_CACHE_MS });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
