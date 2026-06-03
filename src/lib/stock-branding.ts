import stockLogosManifest from "../../data/stock-logos-manifest.json";
import type { PolygonTickerDetails } from "@/lib/stock-profile";
import { normalizeTicker } from "@/lib/polygon";

const STATIC_LOGO_PATHS: Record<string, string> = stockLogosManifest;

export type PolygonBranding = {
  logo_url?: string | null;
  icon_url?: string | null;
};

/** Local static logo path when we have a downloaded asset; otherwise null. */
export function staticStockLogoPath(ticker: string): string | null {
  const sym = normalizeTicker(ticker);
  return STATIC_LOGO_PATHS[sym] ?? null;
}

/** Public URL for a ticker logo (static file if downloaded, else API proxy). */
export function stockLogoServePath(ticker: string): string {
  const sym = normalizeTicker(ticker);
  return staticStockLogoPath(ticker) ?? `/api/stock-logo/${encodeURIComponent(sym)}`;
}

/** Prefer local /stock-logos for list UIs; avoids proxy fetches when no asset exists. */
export function preferredListLogoUrl(ticker: string, logoUrl?: string | null): string {
  const sym = normalizeTicker(ticker);
  const staticPath = STATIC_LOGO_PATHS[sym];
  if (staticPath) return staticPath;
  const normalized = normalizeClientLogoUrl(logoUrl, sym);
  if (normalized?.startsWith("/stock-logos/")) return normalized;
  return "";
}

export function extractPolygonBranding(raw: unknown): PolygonBranding | null {
  if (!raw || typeof raw !== "object") return null;
  const branding = (raw as { branding?: PolygonBranding }).branding;
  if (!branding || typeof branding !== "object") return null;
  return branding;
}

/** Prefer square icon for tiles; fall back to wide logo. */
export function pickPolygonBrandingImageUrl(branding: PolygonBranding | null): string | null {
  if (!branding) return null;
  const icon = branding.icon_url?.trim();
  if (icon) return icon;
  const logo = branding.logo_url?.trim();
  return logo || null;
}

export function pickPolygonBrandingFromDetails(
  details: PolygonTickerDetails | null,
): string | null {
  return pickPolygonBrandingImageUrl(details?.branding ?? null);
}

/**
 * Stored/serve URL when Polygon has branding; null when UI should use letter-tile only.
 */
export function resolveStockLogoServePath(
  ticker: string,
  details: PolygonTickerDetails | null,
): string | null {
  return pickPolygonBrandingFromDetails(details) ? stockLogoServePath(ticker) : null;
}

export function appendPolygonApiKey(imageUrl: string, apiKey: string): string {
  try {
    const url = new URL(imageUrl);
    if (!url.searchParams.has("apiKey")) {
      url.searchParams.set("apiKey", apiKey);
    }
    return url.toString();
  } catch {
    const sep = imageUrl.includes("?") ? "&" : "?";
    return `${imageUrl}${sep}apiKey=${encodeURIComponent(apiKey)}`;
  }
}

/** Normalize legacy DB values (raw Polygon URLs) to our proxy path. */
export function normalizeClientLogoUrl(
  logoUrl: string | null | undefined,
  ticker: string,
): string | null {
  const trimmed = logoUrl?.trim();
  const sym = normalizeTicker(ticker);
  if (!sym) return null;
  if (!trimmed) return null;
  if (trimmed.startsWith("/api/stock-logo/")) return trimmed;
  if (/polygon\.io/i.test(trimmed)) return stockLogoServePath(sym);
  // Legacy Clearbit URLs in seed data — use Polygon proxy instead.
  if (/clearbit\.com/i.test(trimmed)) return null;
  return trimmed;
}
