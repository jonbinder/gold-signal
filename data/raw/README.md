# ETF holdings CSVs (manual download)

Download quarterly from each fund’s holdings page and save with these exact filenames:

| File | Fund |
|------|------|
| `gdx-holdings.csv` | VanEck Gold Miners ETF (GDX) |
| `gdxj-holdings.csv` | VanEck Junior Gold Miners ETF (GDXJ) |
| `sil-holdings.csv` | Global X Silver Miners ETF (SIL) |
| `silj-holdings.csv` | Amplify Junior Silver Miners ETF (SILJ) |

Then run:

```bash
npm run build:universe
```

The script also pulls royalty tickers and Polygon SIC 1040/1044 listings without these files.
