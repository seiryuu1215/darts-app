import sharp from "sharp";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/icons");
const FAVICON = resolve(ROOT, "app/favicon.ico");
const TMP_PNG = "/tmp/favicon-base.png";

mkdirSync(OUT, { recursive: true });

// Convert ICO to PNG using macOS sips (sharp doesn't support ICO)
execSync(`sips -s format png "${FAVICON}" --out "${TMP_PNG}"`, {
  stdio: "ignore",
});

async function generate() {
  const base = sharp(TMP_PNG).png();

  // 192x192
  await base
    .clone()
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .toFile(resolve(OUT, "icon-192.png"));

  // 512x512
  await base
    .clone()
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .toFile(resolve(OUT, "icon-512.png"));

  // 512x512 maskable (icon centered in safe zone = 80% of canvas)
  const iconSize = Math.round(512 * 0.8);
  const iconBuf = await base
    .clone()
    .resize(iconSize, iconSize, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 }, // #121212
    },
  })
    .composite([{ input: iconBuf, gravity: "centre" }])
    .png()
    .toFile(resolve(OUT, "icon-512-maskable.png"));

  console.log("Icons generated in public/icons/");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
