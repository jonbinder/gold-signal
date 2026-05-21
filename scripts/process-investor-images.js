const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "..", "public", "images", "investors");
const outputDir = path.join(inputDir, "processed");

fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

Promise.all(
  files.map((file) =>
    sharp(path.join(inputDir, file))
      .resize(400, 400, { fit: "cover", position: "top" })
      .jpeg({ quality: 88 })
      .toFile(path.join(outputDir, file.replace(/\.[^.]+$/, ".jpg")))
      .then(() => console.log(`✓ ${file}`))
      .catch((err) => console.error(`✗ ${file}:`, err.message)),
  ),
).then(() => {
  for (const file of fs.readdirSync(outputDir)) {
    const dest = path.join(inputDir, file);
    const tmp = dest + ".tmp";
    fs.copyFileSync(path.join(outputDir, file), tmp);
    fs.renameSync(tmp, dest);
  }
  console.log("Copied processed images to", inputDir);
});
