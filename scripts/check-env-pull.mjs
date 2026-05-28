import { readFileSync, existsSync } from "node:fs";

const file = process.argv[2] ?? ".env.vercel.production";
if (!existsSync(file)) {
  console.error("missing", file);
  process.exit(1);
}
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PROCESS_SECRET",
  "CRON_SECRET",
  "POLYGON_API_KEY",
  "RESEND_API_KEY",
];
const map = {};
for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) map[m[1].trim()] = m[2];
}
for (const k of keys) {
  const v = map[k] ?? "";
  const len = v.length;
  console.log(`${k}: ${len > 0 ? `set (${len} chars)` : "EMPTY"}`);
}
