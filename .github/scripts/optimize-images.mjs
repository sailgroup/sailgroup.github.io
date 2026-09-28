// Shrinks oversized content images in the BUILT site (_site) before it is uploaded to
// GitHub Pages. The originals in the repository are never modified, so whoever adds a
// photo can upload it as it came off the phone or camera; visitors get a web-sized copy.
//
// Scope: only the upload folders people/, photos/, pubs/ under assets/images/. Logos,
// icons, badges, journal covers, and research figures (the assets/images/ root) and
// journal logos (journals/) are left as they are.
//
// A JPG/PNG is processed only when it is larger than its folder's limit (longest side in
// pixels, or file size); it is scaled down to fit the limit, never enlarged, keeps its
// aspect ratio (so page layout does not change), and is written back only when the
// result is at least 10% smaller. Any error leaves that file untouched.
//
// Usage (CI, after `jekyll build`): node .github/scripts/optimize-images.mjs _site/assets/images

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.argv[2];
if (!root) {
  console.error("usage: node optimize-images.mjs <built images dir>");
  process.exit(2);
}

// Longest side (px) and file-size budget (bytes) per upload folder.
const LIMITS = {
  people: { side: 800, bytes: 250 * 1024 },  // portraits: shown at 180-280px
  photos: { side: 1600, bytes: 600 * 1024 }, // gallery: full-size view in the lightbox
  pubs: { side: 1200, bytes: 400 * 1024 },   // graphical abstracts: at most 320px tall on paper pages
};

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let checked = 0, changed = 0, failed = 0, before = 0, after = 0;

for (const [folder, limit] of Object.entries(LIMITS)) {
  const dir = path.join(root, folder);
  try {
    for await (const file of walk(dir)) {
      const ext = path.extname(file).toLowerCase();
      if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;
      checked++;
      try {
        const input = await readFile(file);
        const meta = await sharp(input).metadata();
        const side = Math.max(meta.width || 0, meta.height || 0);
        if (side <= limit.side && input.length <= limit.bytes) continue;

        let img = sharp(input).rotate().resize({
          width: limit.side, height: limit.side, fit: "inside", withoutEnlargement: true,
        });
        img = ext === ".png"
          ? img.png({ compressionLevel: 9, adaptiveFiltering: true })
          : img.jpeg({ quality: 82, mozjpeg: true });
        const output = await img.toBuffer();

        if (output.length <= input.length * 0.9) {
          await writeFile(file, output);
          changed++;
          before += input.length;
          after += output.length;
          const rel = path.relative(root, file).split(path.sep).join("/");
          console.log(`${rel}: ${meta.width}x${meta.height}, ${Math.round(input.length / 1024)} KB -> ${Math.round(output.length / 1024)} KB`);
        }
      } catch (e) {
        failed++;
        console.warn(`skipped ${file}: ${e.message}`);
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e; // a missing folder just means nothing to do
  }
}

console.log(
  `optimize-images: checked ${checked}, reduced ${changed}` +
  (changed ? ` (${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB)` : "") +
  (failed ? `, left ${failed} unchanged after an error` : "")
);
