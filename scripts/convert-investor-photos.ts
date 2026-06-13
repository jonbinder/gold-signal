/**
 * One-off: convert attached investor PNGs to public/investor-photos/*.webp
 */
import sharp from "sharp";
import path from "path";

const base = path.join(
  process.env.USERPROFILE ?? process.env.HOME ?? "",
  ".cursor",
  "projects",
  "c-Users-jonat-gold-signal",
  "assets",
);

const outDir = path.join(process.cwd(), "public", "investor-photos");

const files: Array<[string, string]> = [
  [
    "peter-schiff",
    "c__Users_jonat_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_peter-schiff-2ef1d7d2-b1ba-4a04-bdde-fb9433119759.png",
  ],
  [
    "lawrence-lepard",
    "c__Users_jonat_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_lawrence-lepard-7d03647f-4c7d-4ebc-906a-7ec51515517b.png",
  ],
  [
    "eric-sprott",
    "c__Users_jonat_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_eric-sprott-cae17c2d-8082-49cc-95ca-7266d5857d56.png",
  ],
];

async function main() {
  for (const [slug, file] of files) {
    const src = path.join(base, file);
    const dest = path.join(outDir, `${slug}.webp`);
    await sharp(src).resize(400, 400, { fit: "cover", position: "top" }).webp({ quality: 85 }).toFile(dest);
    console.log("wrote", dest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
