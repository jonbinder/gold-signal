# Adding an investor

No app code changes are required. Add data, drop a photo, sync, deploy.

## 1. Workbook row (`data/GS-Investors.xlsx`)

Add at least one row on the `GS-Investors` sheet with the `investor` column set. Position columns can be empty until you have holdings — the investor still appears on `/portfolios` with a `[ NEEDS DATA ]` position count.

**Required:**

| Column | Example |
|--------|---------|
| `investor` | `Jane Doe` |

**When adding positions** (one row per holding):

| Column | Example |
|--------|---------|
| `ticker` | `FNV` |
| `company_name` | `Franco-Nevada Corp` |
| `position_type` | `stake`, `insider`, `fund`, `statement`, or `other` |
| `detail` | `~9% (named top position)` |
| `source_type` | `interview` |
| `source_detail` | `Podcast: Triangle Investor` |
| `date` | `2026-03` or `2026-03-15` |

**Optional profile columns** (on any row for that investor; `[ NEEDS DATA ]` if empty):

`bio_short`, `bio_long`, `website`, `x_handle`

## 2. Photo

1. Save as `public/investor-photos/{slug}.webp` (`.jpg` / `.png` also work).
2. Recommended: **400×400 px**, headshot crop (`object-fit: cover` on photos).
3. Missing files fall back to initials — no build failure.

**Slug rule** (`slugFromInvestorName` in `src/lib/investors/csv-data.ts`):

- Lowercase, strip accents, non-alphanumerics → hyphens
- Example: `Jane Doe` → `jane-doe`

Same slug drives `/portfolios/[slug]`, photo filename, and Supabase `investors.slug`.

## 3. Sync and deploy

```bash
npm run investors:sync
```

This:

1. Writes `public/data/investors.json`
2. **Upserts** every workbook investor into Supabase `investors` (`is_published = true` for new rows)
3. Destructively replaces `investor_positions` from workbook holdings (unchanged behavior)

Redeploy or revalidate cache so pages pick up changes. `prebuild` runs sync automatically.

## Checklist

- [ ] Row in `GS-Investors.xlsx` with `investor` name
- [ ] Photo at `public/investor-photos/{slug}.webp` (optional; initials fallback works)
- [ ] `npm run investors:sync` (or deploy, which runs it via `prebuild`)

## Slug consistency

Single slug source: **`slugFromInvestorName`**. Legacy aliases (e.g. `sprott-asset-management` → `sprott-inc`) are in `normalizeTrackedInvestorSlug` only.
