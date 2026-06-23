# Adding an investor

No app code changes are required. After data is in place, run the sync and deploy.

## 1. Supabase profile row

Add a row to the `investors` table (or extend `scripts/seed-investors.ts` and run it once):

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | yes | Must match the slug derived from the display name (see below) |
| `name` | yes | Display name, e.g. `Adrian Day` |
| `is_published` | yes | `true` |
| `type` | yes | `individual` or `fund` |
| `sort_order` | optional | Controls default ordering before position `updated_at` sort |

**Slug rule** (single source: `slugFromInvestorName` in `src/lib/investors/csv-data.ts`):

- Lowercase the name
- Strip accents (NFKD)
- Replace non-alphanumerics with hyphens
- Example: `Pierre Lassonde` → `pierre-lassonde`

The same slug is used for `/portfolios/[slug]`, photo filenames, and workbook rows.

## 2. Workbook positions (`data/GS-Investors.xlsx`)

Add one or more rows on the `GS-Investors` sheet. The investor appears on `/portfolios` only when they have **≥1 distinct ticker** (placeholder rows are excluded).

**Required columns per position row:**

| Column | Example |
|--------|---------|
| `investor` | `Adrian Day` (must slug-match Supabase `slug`) |
| `ticker` | `FNV` |
| `company_name` | `Franco-Nevada Corp` |
| `position_type` | `stake`, `insider`, `fund`, `statement`, or `other` |
| `detail` | `~9% (named top position)` |
| `source_type` | `interview` |
| `source_detail` | `Podcast: Triangle Investor` |
| `date` | `2026-03` or `2026-03-15` |

**Optional profile columns** (fill on the investor’s first row; `[ NEEDS DATA ]` shows if empty):

`bio_short`, `bio_long`, `website`, `x_handle`

## 3. Photo

1. Save as `public/investor-photos/{slug}.webp` (`.jpg` / `.png` also work).
2. Recommended: **400×400 px**, cropped for a headshot (`object-fit: cover`).
3. Missing files fall back to initials — no build failure.

At build/runtime, `resolveInvestorPhotoPath(slug)` checks `public/investor-photos/` then `public/investors/`, then the placeholder SVG.

## 4. Sync and deploy

```bash
npm run investors:sync
```

This writes `public/data/investors.json` and, when Supabase service role is configured, replaces `investor_positions` from the workbook.

Redeploy (or trigger cache revalidation) so `/portfolios` picks up the new data.

## Checklist

- [ ] Supabase `investors` row with matching `slug` and `is_published = true`
- [ ] ≥1 real position row in `GS-Investors.xlsx` for that investor name
- [ ] Photo at `public/investor-photos/{slug}.webp` (optional but recommended)
- [ ] `npm run investors:sync` run before deploy

## Slug consistency

Slug generation lives in **`slugFromInvestorName`** (`csv-data.ts`). Supabase `investors.slug` must equal that output for the workbook `investor` name. Legacy aliases (e.g. `sprott-asset-management` → `sprott-inc`) are handled only in `normalizeTrackedInvestorSlug` (`tracked-roster.ts`).

Do not hand-edit slugs in one place without updating the others.
