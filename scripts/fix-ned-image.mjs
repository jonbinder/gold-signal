import fs from "fs";

const UA = "GoldSignalBot/1.0";
const html = await fetch("https://www.finnotes.org/people/ned-naylor-leyland", {
  headers: { "User-Agent": UA },
}).then((r) => r.text());
const urls = [
  ...html.matchAll(/https:\/\/finn--production\.s3\.amazonaws\.com\/uploads\/[^\s"]+\.(?:jpeg|jpg|png)/g),
].map((m) => m[0]);
console.log(urls);
if (!urls[0]) process.exit(1);
const buf = await fetch(urls[0], { headers: { "User-Agent": UA } }).then((r) => r.arrayBuffer());
const out = new URL("../public/images/investors/ned-naylor-leyland.jpg", import.meta.url);
fs.writeFileSync(out, Buffer.from(buf));
console.log("saved", buf.byteLength);
