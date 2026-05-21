/**
 * Download investor headshots via Wikidata P18 / Commons search fallbacks.
 * Run: node scripts/download-investor-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "images", "investors");
const UA = "GoldSignalBot/1.0 (https://goldsignal.ai; investor-images)";

/** @type {{ file: string; wikidata?: string; commonsSearch: string; fallbacks?: string[] }[]} */
const INVESTORS = [
  { file: "peter-schiff.jpg", wikidata: "Q512741", commonsSearch: "Peter Schiff portrait" },
  { file: "eric-sprott.jpg", commonsSearch: "Eric Sprott", fallbacks: ["https://upload.wikimedia.org/wikipedia/commons/5/5c/Eric_Sprott_2012.jpg"] },
  { file: "sprott-asset-management.jpg", commonsSearch: "Eric Sprott", fallbacks: ["https://upload.wikimedia.org/wikipedia/commons/5/5c/Eric_Sprott_2012.jpg"] },
  { file: "ross-beaty.jpg", commonsSearch: "Ross Beaty", fallbacks: [] },
  { file: "frank-giustra.jpg", commonsSearch: "Frank Giustra", fallbacks: [] },
  { file: "rick-rule.jpg", commonsSearch: "Rick Rule Sprott", fallbacks: [] },
  { file: "john-hathaway.jpg", commonsSearch: "John Hathaway gold", fallbacks: [] },
  { file: "ned-naylor-leyland.jpg", commonsSearch: "Ned Naylor-Leyland", fallbacks: ["https://www.jupiteram.com/media/ned-naylor-leyland.jpg"] },
  { file: "pierre-lassonde.jpg", wikidata: "Q3382607", commonsSearch: "Pierre Lassonde" },
  { file: "doug-casey.jpg", commonsSearch: "Doug Casey", fallbacks: [] },
  { file: "marin-katusa.jpg", commonsSearch: "Marin Katusa", fallbacks: [] },
  { file: "nolan-watson.jpg", commonsSearch: "Nolan Watson Sandstorm", fallbacks: [] },
  { file: "lukas-lundin.jpg", commonsSearch: "Lukas Lundin", fallbacks: [] },
  { file: "thomas-kaplan.jpg", commonsSearch: "Thomas Kaplan", fallbacks: [] },
  { file: "grant-williams.jpg", commonsSearch: "Grant Williams finance", fallbacks: [] },
  { file: "mark-bristow.jpg", commonsSearch: "Mark Bristow mining", fallbacks: [] },
  { file: "david-garofalo.jpg", commonsSearch: "David Garofalo", fallbacks: [] },
  { file: "keith-neumeyer.jpg", commonsSearch: "Keith Neumeyer", fallbacks: [] },
  { file: "bob-quartermaine.jpg", commonsSearch: "Bob Quartermain Seabridge", fallbacks: [] },
  { file: "tavi-costa.jpg", commonsSearch: "Tavi Costa Crescat", fallbacks: [] },
  { file: "brien-lundin.jpg", commonsSearch: "Brien Lundin", fallbacks: [] },
  { file: "rob-mcewen.jpg", commonsSearch: "Rob McEwen", fallbacks: [] },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function wikidataImageUrl(qid) {
  const data = await fetchJson(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  const entity = data.entities?.[qid];
  const file = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!file) return null;
  const title = encodeURIComponent(file.replace(/ /g, "_"));
  const info = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${title}&prop=imageinfo&iiprop=url&iiurlwidth=440&format=json`,
  );
  const pages = info.query?.pages;
  const page = pages && Object.values(pages)[0];
  return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
}

async function commonsSearchUrl(search) {
  const q = encodeURIComponent(search);
  const data = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=440&format=json`,
  );
  const pages = data.query?.pages;
  if (!pages) return null;
  for (const page of Object.values(pages)) {
    const url = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
    if (url && /\.(jpg|jpeg|png)/i.test(url)) return url;
  }
  return null;
}

async function downloadUrl(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://goldsignal.ai/" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error(`too small (${buf.length}b)`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function resolveImageUrl(inv) {
  if (inv.wikidata) {
    try {
      const url = await wikidataImageUrl(inv.wikidata);
      if (url) return url;
    } catch {
      /* continue */
    }
    await sleep(500);
  }
  try {
    const url = await commonsSearchUrl(inv.commonsSearch);
    if (url) return url;
  } catch {
    /* continue */
  }
  await sleep(500);
  for (const url of inv.fallbacks || []) {
    try {
      const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
      if (res.ok) return url;
    } catch {
      /* continue */
    }
  }
  return null;
}

async function main() {
  let ok = 0;
  let fail = 0;
  for (const inv of INVESTORS) {
    const dest = path.join(OUT_DIR, inv.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
      console.log(`skip ${inv.file} (exists)`);
      ok++;
      continue;
    }
    process.stdout.write(`${inv.file} ... `);
    try {
      const url = await resolveImageUrl(inv);
      if (!url) {
        console.log("NO SOURCE");
        fail++;
        continue;
      }
      const bytes = await downloadUrl(url, dest);
      console.log(`OK ${bytes}b`);
      ok++;
    } catch (e) {
      console.log(`FAIL ${e.message}`);
      fail++;
    }
    await sleep(1200);
  }
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main();
