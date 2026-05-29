import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
let envFile;
let submissionId;
if (args.length >= 2 && existsSync(args[0])) {
  envFile = args[0];
  submissionId = args[1];
} else {
  submissionId = args[0];
}
if (!submissionId) {
  console.error("Usage: node scripts/invoke-process-one.mjs [env-file] <submissionId>");
  console.error("  Or: vercel env run -- node scripts/invoke-process-one.mjs <submissionId>");
  process.exit(1);
}

let secret = process.env.PROCESS_SECRET?.trim() ?? "";
if (!secret && envFile && existsSync(envFile)) {
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("PROCESS_SECRET=")) {
      secret = line.slice("PROCESS_SECRET=".length).trim().replace(/^"|"$/g, "");
      break;
    }
  }
}
if (!secret || secret.length < 8) {
  console.error("PROCESS_SECRET missing or too short in", envFile);
  process.exit(1);
}

const origin = process.env.ORIGIN ?? "https://goldsignal.ai";
const url = `${origin}/api/process-one?submissionId=${encodeURIComponent(submissionId)}`;
const res = await fetch(url, { headers: { "x-process-secret": secret } });
const body = await res.text();
console.log("status", res.status);
console.log("body", body.slice(0, 2000));
process.exit(res.ok ? 0 : 1);
