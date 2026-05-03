import type { CuratedStock, GoldSilverStockCategory } from "@/types/stocks-curated";

type Row = Omit<CuratedStock, "id" | "created_at">;

const E = (ticker: string, name: string, category: GoldSilverStockCategory, exchange: string, m: number | null): Row => ({
  ticker,
  name,
  category,
  exchange,
  market_cap_usd: m,
  is_active: true,
});

/**
 * Curated gold & silver universe (~150–190 unique tickers after dedupe).
 * Fallback when Supabase `stocks` is empty or unreachable.
 * SQL: `npm run db:generate-stocks-seed`
 */
const RAW_GOLD_SILVER_STOCKS: Row[] = [
  // ETFs (physical + miners + silver + leverage)
  E("GLD", "SPDR Gold Trust", "ETF", "NYSEARCA", 65_000_000_000),
  E("IAU", "iShares Gold Trust", "ETF", "NYSEARCA", 35_000_000_000),
  E("GLDM", "SPDR Gold MiniShares", "ETF", "NYSEARCA", 8_000_000_000),
  E("SGOL", "abrdn Physical Gold Shares", "ETF", "NYSEARCA", 4_000_000_000),
  E("BAR", "GraniteShares Gold Trust", "ETF", "NYSEARCA", 1_200_000_000),
  E("OUNZ", "VanEck Merk Gold Trust", "ETF", "NYSEARCA", 900_000_000),
  E("AAAU", "Goldman Sachs Physical Gold ETF", "ETF", "NYSEARCA", 1_500_000_000),
  E("GDX", "VanEck Gold Miners ETF", "ETF", "NYSEARCA", 16_000_000_000),
  E("GDXJ", "VanEck Junior Gold Miners ETF", "ETF", "NYSEARCA", 6_000_000_000),
  E("RING", "iShares MSCI Global Gold Miners ETF", "ETF", "NYSEARCA", 800_000_000),
  E("SILJ", "Amplify Junior Silver Miners ETF", "ETF", "NYSEARCA", 1_100_000_000),
  E("SIL", "Global X Silver Miners ETF", "ETF", "NYSEARCA", 1_400_000_000),
  E("SLV", "iShares Silver Trust", "ETF", "NYSEARCA", 14_000_000_000),
  E("SIVR", "abrdn Physical Silver Shares", "ETF", "NYSEARCA", 1_800_000_000),
  E("PSLV", "Sprott Physical Silver Trust", "ETF", "NYSEARCA", 5_000_000_000),
  E("CEF", "Sprott Physical Gold and Silver Trust", "ETF", "NYSEARCA", 6_500_000_000),
  E("DBP", "Invesco DB Precious Metals Fund", "ETF", "NYSEARCA", 400_000_000),
  E("GDXU", "MicroSectors Gold Miners 3X ETN", "ETF", "NYSEARCA", 250_000_000),
  E("JNUG", "Direxion Daily Junior Gold Miners 2X", "ETF", "NYSEARCA", 800_000_000),
  E("NUGT", "Direxion Daily Gold Miners 2X", "ETF", "NYSEARCA", 1_200_000_000),
  E("DUST", "Direxion Daily Gold Miners 2X Bear", "ETF", "NYSEARCA", 200_000_000),
  E("JDST", "Direxion Daily Junior Gold Miners 2X Bear", "ETF", "NYSEARCA", 150_000_000),
  E("AGQ", "ProShares Ultra Silver", "ETF", "NYSEARCA", 600_000_000),
  E("UGL", "ProShares Ultra Gold", "ETF", "NYSEARCA", 350_000_000),
  E("GLL", "ProShares UltraShort Gold", "ETF", "NYSEARCA", 80_000_000),
  E("ZSL", "ProShares UltraShort Silver", "ETF", "NYSEARCA", 40_000_000),
  E("GOEX", "Global X Gold Explorers ETF", "ETF", "NYSEARCA", 120_000_000),
  E("PICK", "iShares MSCI Global Metals & Mining ETF", "ETF", "NASDAQ", 2_800_000_000),
  E("SLVR", "Sprott Physical Silver ETF", "ETF", "NYSEARCA", 200_000_000),
  E("SGDM", "Sprott Gold Miners ETF", "ETF", "NYSEARCA", 350_000_000),
  E("SGDJ", "Sprott Junior Gold Miners ETF", "ETF", "NYSEARCA", 180_000_000),

  // Royalty / streaming
  E("WPM", "Wheaton Precious Metals", "Royalty/Streaming", "NYSE", 24_000_000_000),
  E("FNV", "Franco-Nevada Corporation", "Royalty/Streaming", "NYSE", 28_000_000_000),
  E("RGLD", "Royal Gold Inc", "Royalty/Streaming", "NASDAQ", 12_000_000_000),
  E("OR", "Osisko Gold Royalties", "Royalty/Streaming", "NYSE", 4_200_000_000),
  E("SAND", "Sandstorm Gold Ltd", "Royalty/Streaming", "NYSE", 1_800_000_000),
  E("MTA", "Metalla Royalty & Streaming", "Royalty/Streaming", "NYSE", 450_000_000),
  E("EMX", "EMX Royalty Corporation", "Royalty/Streaming", "NYSE", 380_000_000),
  E("GROY", "Gold Royalty Corp", "Royalty/Streaming", "NYSE", 280_000_000),
  E("ELEMF", "Elemental Altus Royalties", "Royalty/Streaming", "OTC", 120_000_000),

  // Gold producers (senior / mid-tier)
  E("NEM", "Newmont Corporation", "Gold Producer", "NYSE", 52_000_000_000),
  E("GOLD", "Barrick Gold Corporation", "Gold Producer", "NYSE", 36_000_000_000),
  E("AEM", "Agnico Eagle Mines", "Gold Producer", "NYSE", 44_000_000_000),
  E("KGC", "Kinross Gold Corporation", "Gold Producer", "NYSE", 9_500_000_000),
  E("IAG", "IAMGOLD Corporation", "Gold Producer", "NYSE", 3_200_000_000),
  E("AGI", "Alamos Gold Inc", "Gold Producer", "NYSE", 5_800_000_000),
  E("BTG", "B2Gold Corp", "Gold Producer", "NYSE", 4_500_000_000),
  E("EGO", "Eldorado Gold Corporation", "Gold Producer", "NYSE", 3_600_000_000),
  E("EQX", "Equinox Gold Corp", "Gold Producer", "NYSE", 2_900_000_000),
  E("MUX", "McEwen Mining Inc", "Gold Producer", "NYSE", 450_000_000),
  E("HMY", "Harmony Gold Mining", "Gold Producer", "NYSE", 4_100_000_000),
  E("AU", "AngloGold Ashanti", "Gold Producer", "NYSE", 12_000_000_000),
  E("GFI", "Gold Fields Limited", "Gold Producer", "NYSE", 11_000_000_000),
  E("SSRM", "SSR Mining Inc", "Gold Producer", "NASDAQ", 2_400_000_000),
  E("ORLA", "Orla Mining Ltd", "Gold Producer", "NYSE", 1_900_000_000),
  E("LUG", "Lundin Gold Inc", "Gold Producer", "NASDAQ", 3_800_000_000),
  E("OGC", "OceanaGold Corporation", "Gold Producer", "NYSE", 1_600_000_000),
  E("WDO", "Wesdome Gold Mines Ltd", "Gold Producer", "NYSE", 1_400_000_000),
  E("KNT", "K92 Mining Inc", "Gold Producer", "NYSE", 1_100_000_000),
  E("TXG", "Torex Gold Resources", "Gold Producer", "NYSE", 1_700_000_000),
  E("NGD", "New Gold Inc", "Gold Producer", "NYSE", 1_100_000_000),
  E("SBSW", "Sibanye Stillwater Limited", "Gold Producer", "NYSE", 3_800_000_000),
  E("AUY", "Yamana Gold Inc", "Gold Producer", "NYSE", 4_000_000_000),
  E("NCMGY", "Newcrest Mining ADR", "Gold Producer", "OTC", 15_000_000_000),
  E("NST", "Northern Star Resources ADR", "Gold Producer", "OTC", 9_000_000_000),
  E("EVN", "Evolution Mining ADR", "Gold Producer", "OTC", 5_500_000_000),
  E("RMS", "Ramelius Resources ADR", "Gold Producer", "OTC", 1_800_000_000),
  E("EDV", "Endeavour Mining PLC ADR", "Gold Producer", "OTC", 8_200_000_000),
  E("PRU", "Perseus Mining ADR", "Gold Producer", "OTC", 2_200_000_000),
  E("LUN", "Lundin Mining Corporation", "Gold Producer", "TSX", 8_000_000_000),
  E("DRD", "DRDGOLD Limited", "Gold Producer", "NYSE", 1_200_000_000),
  E("BVN", "Compania de Minas Buenaventura", "Gold Producer", "NYSE", 2_800_000_000),

  // Silver producers
  E("PAAS", "Pan American Silver Corp", "Silver Producer", "NASDAQ", 7_000_000_000),
  E("AG", "First Majestic Silver Corp", "Silver Producer", "NYSE", 4_000_000_000),
  E("HL", "Hecla Mining Company", "Silver Producer", "NYSE", 3_500_000_000),
  E("CDE", "Coeur Mining Inc", "Silver Producer", "NYSE", 2_100_000_000),
  E("EXK", "Endeavour Silver Corp", "Silver Producer", "NYSE", 900_000_000),
  E("MAG", "MAG Silver Corp", "Silver Producer", "NYSE", 1_500_000_000),
  E("SVM", "Silvercorp Metals Inc", "Silver Producer", "NYSE", 800_000_000),
  E("SILV", "SilverCrest Metals Inc", "Silver Producer", "NYSE", 1_200_000_000),
  E("FSM", "Fortuna Silver Mines Inc", "Silver Producer", "NYSE", 1_800_000_000),
  E("ASM", "Avino Silver & Gold Mines", "Silver Producer", "NYSE", 120_000_000),
  E("USAS", "Americas Gold and Silver Corp", "Silver Producer", "NYSE", 180_000_000),

  // Junior explorers & developers (broad, liquid-adjacent list)
  E("NFGC", "New Found Gold Corp", "Junior Explorer", "NYSE", 900_000_000),
  E("USAU", "U.S. GoldMining Inc", "Junior Explorer", "NASDAQ", 180_000_000),
  E("THM", "International Tower Hill Mines", "Junior Explorer", "NYSE", 180_000_000),
  E("LODE", "Comstock Mining Inc", "Junior Explorer", "NYSE", 90_000_000),
  E("AUMN", "Golden Minerals Company", "Junior Explorer", "NYSE", 40_000_000),
  E("PLG", "Platinum Group Metals Ltd", "Junior Explorer", "NYSE", 180_000_000),
  E("TRX", "TRX Gold Corporation", "Junior Explorer", "NYSE", 90_000_000),
  E("IAUX", "i-80 Gold Corp", "Junior Explorer", "NYSE", 1_100_000_000),
  E("ARIS", "Aris Gold Corporation", "Junior Explorer", "NYSE", 1_400_000_000),
  E("DSV", "Discovery Silver Corp", "Junior Explorer", "NYSE", 900_000_000),
  E("ORE", "Orezone Gold Corporation", "Junior Explorer", "NYSE", 380_000_000),
  E("SA", "Seabridge Gold Inc", "Junior Explorer", "NYSE", 1_200_000_000),
  E("SKE", "Skeena Resources Ltd", "Junior Explorer", "NYSE", 900_000_000),
  E("TMQ", "Trilogy Metals Inc", "Junior Explorer", "NYSE", 180_000_000),
  E("VGZ", "Vista Gold Corp", "Junior Explorer", "NYSE", 140_000_000),
  E("WRN", "Western Alaska Minerals", "Junior Explorer", "NYSE", 220_000_000),
  E("DC", "Dakota Gold Corp", "Junior Explorer", "NYSE", 280_000_000),
  E("FVL", "Freegold Ventures Ltd", "Junior Explorer", "TSX", 90_000_000),
  E("GCM", "Gran Colombia Gold Corp", "Junior Explorer", "NYSE", 450_000_000),
  E("GGI", "Garibaldi Resources Corp", "Junior Explorer", "TSX", 60_000_000),
  E("HSTR", "Heliostar Metals Ltd", "Junior Explorer", "TSX", 70_000_000),
  E("ITM", "Integra Resources Corp", "Junior Explorer", "NYSE", 220_000_000),
  E("KORE", "Kore Mining Ltd", "Junior Explorer", "NYSE", 110_000_000),
  E("LGC", "Leocor Gold Inc", "Junior Explorer", "TSX", 45_000_000),
  E("MAI", "Minera Alamos Inc", "Junior Explorer", "TSX", 95_000_000),
  E("NCX", "NorthIsle Copper & Gold", "Junior Explorer", "TSX", 55_000_000),
  E("PPTA", "Perpetua Resources Corp", "Junior Explorer", "NASDAQ", 450_000_000),
  E("UMAC", "Ultra Metals Corp", "Junior Explorer", "TSX", 40_000_000),
  E("AAUC", "Allied Gold Corp", "Junior Explorer", "NYSE", 320_000_000),
  E("AXU", "Alexandria Minerals", "Junior Explorer", "TSX", 35_000_000),
  E("BGL", "Belo Sun Mining Corp", "Junior Explorer", "TSX", 85_000_000),
  E("CKG", "Chesapeake Gold Corp", "Junior Explorer", "TSX", 75_000_000),
  E("CNL", "Carolina Gold Corp", "Junior Explorer", "TSX", 50_000_000),
  E("ELBM", "Electra Battery Materials", "Junior Explorer", "TSX", 120_000_000),
  E("GSV", "Gold Standard Ventures Corp", "Junior Explorer", "NYSE", 280_000_000),
  E("IVS", "Inventus Mining Corp", "Junior Explorer", "TSX", 30_000_000),
  E("JAG", "Jaguar Mining Inc", "Junior Explorer", "TSX", 95_000_000),
  E("PZG", "Paramount Gold Nevada Corp", "Junior Explorer", "NYSE", 65_000_000),
  E("TUD", "Tudor Gold Corp", "Junior Explorer", "TSX", 180_000_000),
  E("WGX", "Westgold Resources Ltd", "Junior Explorer", "ASX", 900_000_000),
  E("XPL", "Solitario Zinc Corp", "Junior Explorer", "NYSE", 40_000_000),
  E("NGEX", "NGEx Resources Ltd", "Junior Explorer", "TSX", 420_000_000),
  E("FURY", "Fury Gold Mines Inc", "Junior Explorer", "NYSE", 180_000_000),
  E("GGO", "Goldgroup Mining Inc", "Junior Explorer", "TSX", 55_000_000),
  E("GGD", "Gogold Resources Inc", "Junior Explorer", "TSX", 320_000_000),
  E("KRR", "Kerr Mines Inc", "Junior Explorer", "TSX", 45_000_000),
  E("CEY", "Centamin PLC ADR", "Gold Producer", "NYSE", 2_100_000_000),
  E("CG", "Centerra Gold Inc", "Gold Producer", "NYSE", 1_900_000_000),
  E("ORGN", "Orogen Royalties Inc", "Royalty/Streaming", "TSXV", 380_000_000),
  E("DEFN", "Defiance Silver Corp", "Junior Explorer", "TSXV", 35_000_000),
  E("APM", "Andean Precious Metals", "Silver Producer", "NYSE", 420_000_000),
  E("ARTG", "Artemis Gold Inc", "Junior Explorer", "TSX", 480_000_000),
  E("BCM", "Bear Creek Mining Corporation", "Junior Explorer", "TSXV", 90_000_000),
  E("CORX", "Cornish Metals Inc", "Junior Explorer", "TSX", 140_000_000),
  E("ALK", "Alkane Resources Ltd", "Junior Explorer", "ASX", 280_000_000),
  E("ATAC", "ATAC Resources Ltd", "Junior Explorer", "TSX", 95_000_000),
  E("BRSL", "Broadscale Gold Corp", "Junior Explorer", "TSX", 40_000_000),
  E("DPM", "DPM Metals Inc", "Junior Explorer", "TSX", 120_000_000),
  E("ELR", "Eastern Platinum Ltd", "Junior Explorer", "TSX", 110_000_000),
  E("ERO", "Ero Copper Corp", "Junior Explorer", "NYSE", 1_800_000_000),
  E("RIOFF", "Rio2 Ltd", "Junior Explorer", "OTC", 110_000_000),
  E("GLTR", "abrdn Physical PM Basket Shares", "ETF", "NYSEARCA", 200_000_000),
  E("AMRK", "A-Mark Precious Metals Inc", "Gold Producer", "NASDAQ", 800_000_000),
  E("SII", "Sprott Inc", "Royalty/Streaming", "NYSE", 4_500_000_000),
  E("FUND", "GoldMining Inc", "Junior Explorer", "OTC", 350_000_000),
  E("TGM", "Troilus Gold Corp", "Junior Explorer", "TSX", 180_000_000),
  E("VIT", "Vital Metals Ltd", "Junior Explorer", "TSX", 45_000_000),
];

function dedupeByTicker(rows: Row[]): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const r of rows) {
    const t = r.ticker.toUpperCase();
    if (seen.has(t)) continue;
    seen.add(t);
    out.push({ ...r, ticker: t });
  }
  return out;
}

/** Deduplicated curated list (first row wins on duplicate tickers). */
export const GOLD_SILVER_STOCK_SEED: Row[] = dedupeByTicker(RAW_GOLD_SILVER_STOCKS);
