import type { PolygonTickerDetails } from "@/lib/stock-profile";
import { normalizeTicker } from "@/lib/polygon";

export type PolygonBranding = {
  logo_url?: string | null;
  icon_url?: string | null;
};

/** Public path served by `/api/stock-logo/[ticker]` (Polygon key stays server-side). */
export function stockLogoServePath(ticker: string): string {
  const sym = normalizeTicker(ticker);
  return `/api/stock-logo/${encodeURIComponent(sym)}`;
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
  return trimmed;
}
